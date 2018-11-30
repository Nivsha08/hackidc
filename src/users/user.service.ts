import * as _ from "lodash";

import { Role } from "../roles/role.model";
import { Team } from "../teams/team.model";
import { TeamService } from "../teams/team.service";
import { User } from "./user.model";
import userRole from "./user.role";
import UserScore from "./user.score";
import { PATH_SANITIZED_FIELDS, SANITIZED_FIELDS, academicInstitutesMap } from "./user.constants";

export class UserService {
  public static createLinkedInUser(profile: any, authToken: string) {
    const defaultAttrs = {
      email: _.get(profile, "emails[0].value"),
      linkedInId: _.get(profile, "id"),
      name: _.get(profile, "displayName"),
      rawLinkedin: profile._raw,
      registerStatus: "pending",
      userPicture: _.get(profile, "photos[0].value"),
      linkedInProfileUrl: _.get(profile, "_json.publicProfileUrl"),
      authToken
    };

    return User.findOrCreate({
      defaults: defaultAttrs,
      where: { linkedInId: { $eq: defaultAttrs.linkedInId } }
    })
      .spread((user: any, _created: any) => user)
      .catch((err: Error) => {
        console.log(err, defaultAttrs);
        throw err;
      });
  }

  public static async finishRegistration({
    user,
    userParams,
    teamParams
  }: {
    user: any;
    userParams: any;
    teamParams: any;
  }) {
    if (!user) {
      throw new Error("No user authenticated: user object is undefined");
    }

    if (_.isUndefined(userParams.role)) {
      throw new Error("Bad user attributes: role is undefined");
    }

    const roleName = _.chain(userParams.role)
      .startCase()
      .split(" ")
      .join("")
      .value();
    delete userParams.role;

    // HERE: build team logic
    const { codeNumber } = teamParams;
    let team;
    if (roleName === "TeamBuilder") {
      team = await TeamService.buildTeam({ builder: user, teamParams });
    }

    if (roleName !== "Loner") {
      await this.connectToTeam({ user, codeNumber, team });
    }
    const { id: roleId } = await userRole.getByName(roleName);

    const extendedAttrs = _.extend(userParams, {
      registerStatus: "review",
      roleId
    });
    const updatedUser = await user.update(extendedAttrs).catch((err: Error) => {
      console.error(`Failed to save user: (Error - ${err.message}) ${err.stack}`);
      throw err;
    });
    await this.updateUserScore(user);
    if (team) {
      // optimize later sanitized team attribute
      user.team = TeamService.sanitize(team);
    }
    return updatedUser;
  }

  /**
   * updateUserWith
   */
  public static async updateUserWith(user: User, attrs: any = {}) {
    this.validateUserParams(attrs, PATH_SANITIZED_FIELDS);
    await user.updateAttributes(attrs).catch(err => {
      console.error(`Failed to update user #${user.id}`, err);
      return false;
    });
    await this.updateUserScore(user);
    return true;
  }

  public static async sanitize(user: User) {
    if (!user) {
      return null;
    }
    const sanitizedParams = _.pick(user, ...SANITIZED_FIELDS);
    sanitizedParams.academicInstitute =
      academicInstitutesMap[sanitizedParams.academicInstitute] || "Unknown";
    const role = await user.$get("role");
    const team: Team = user.team || ((await user.$get("team")) as Team);

    sanitizedParams.role = _.get(role, "name") || "Unavailable";
    sanitizedParams.team = TeamService.sanitize(team);
    return sanitizedParams;
  }

  private static validateUserParams(params: any, sanitizedFields = SANITIZED_FIELDS): void {
    const intersectedKeys = _.difference(Object.keys(params), _.values(sanitizedFields));
    if (intersectedKeys.length > 0) {
      throw new Error(`Params: ${intersectedKeys.join(",")} are not allowed.`);
    }
  }

  public static extractUserParams(params: any, sanitizedFields = SANITIZED_FIELDS) {
    return _.chain(params)
      .get("user")
      .pick(sanitizedFields)
      .mapValues((val, key) => {
        if (typeof val === "string" && !_.includes(["bio"], key)) {
          return _.toLower(val);
        }
        return val;
      })
      .omit("id", "linkedInId", "team", "linkedInProfileUrl")
      .value();
  }

  public static async connectToTeam({
    user,
    codeNumber,
    team
  }: {
    user: User;
    codeNumber: number;
    team: any;
  }) {
    const { id: teamId } = team || (await TeamService.findByCode(codeNumber));

    await user.update({ teamId });
    return user;
  }

  public static async updateCV({ user, fileParams }: { user: any; fileParams: any }) {
    console.log("Uplading", fileParams.mimetype, fileParams.name);
    if (fileParams.mimetype !== "application/pdf") {
      throw new Error("File type is not PDF");
    }

    // in MB
    if (fileParams.data.byteLength / 1000000 >= 5) {
      throw new Error("File size is greater than 5 Mb");
    }

    await user.update({ cvFile: fileParams.data });
  }

  public static async findById(
    id: number,
    { includeDeps = false }: { includeDeps?: boolean } = {}
  ) {
    let includes = [];
    if (includeDeps) {
      includes = [Team, Role];
    }
    const user = await User.findOne({
      where: { id },
      include: includes
    });

    if (!user) {
      throw new Error("No user found!");
    }
    return user;
  }

  public static async deleteUser(id: number) {
    const user = await User.findById(id);
    user.updateAttributes({ isDeleted: true });
  }

  private static async updateUserScore(user: User) {
    if (!user) {
      throw Error("No user is given.");
    }
    if (user.registerStatus.toString() === "pending") {
      return 0;
    }
    const { fieldOfStudy, studyYear, degreeType, academicInstitute, experienceType } = user;
    return await user.updateAttributes({
      score: UserScore.calculateScore({
        fieldOfStudy,
        studyYear,
        degreeType,
        academicInstitute,
        experienceType
      })
    });
  }
}
