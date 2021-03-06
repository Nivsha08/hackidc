import * as _ from "lodash";

import { Role } from "../roles/role.model";
import { Team } from "../teams/team.model";
import { TeamService } from "../teams/team.service";
import { User } from "./user.model";
import userRole from "./user.role";
import UserScore from "./user.score";
import { PATH_SANITIZED_FIELDS, SANITIZED_FIELDS, academicInstitutesMap } from "./user.constants";
import { Sequelize, IsUUID } from "sequelize-typescript";
import * as uuidv4 from "uuid/v4";
import { encryptPassword, comparePassword } from "../concerns/users_utils";

export class UserService {
  public static async createLinkedInUser(profile: any, authToken: string) {
    const defaultAttrs = {
      email: _.get(profile, "emails[0].value"),
      linkedInId: _.get(profile, "id"),
      name: _.get(profile, "displayName"),
      rawLinkedin: profile._raw,
      registerStatus: "pending",
      userPicture: _.get(profile, "_json.pictureUrl"),
      linkedInProfileUrl: _.get(profile, "_json.publicProfileUrl"),
      authToken
    };

    try {
      const [user, _created] = await User.findOrCreate({
        defaults: defaultAttrs,
        where: Sequelize.and({ linkedInId: defaultAttrs.linkedInId })
      });
      if (!_created) await this.updateLinkedInImage(user, _.get(profile, "_json.pictureUrl"));

      return user;
    } catch (error) {
      console.error(error, defaultAttrs);
      throw error;
    }
  }

  public static async finishRegistration({
    user,
    userParams,
    teamParams
  }: {
    user: User;
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
      user.team = await TeamService.sanitize(team);
    }
    return updatedUser;
  }

  public static async updateUserWith(user: User, attrs: any = {}) {
    this.validateUserParams(attrs, PATH_SANITIZED_FIELDS);
    await user.update(attrs).catch(err => {
      console.error(`Failed to update user #${user.id}`, err);
      return false;
    });
    await this.updateUserScore(user);
    return true;
  }

  public static async findUsersByTeamId(teamId: number): Promise<User[]> {
    const foundUsers: User[] = await User.findAll({
      where: Sequelize.and({ teamId })
    });
    return foundUsers;
  }

  public static async getTeamByUserId(userId: number) {
    const user: User = await this.findById(userId, { includeDeps: true });
    return user.team;
  }

  public static async sanitize(
    user: User,
    sanitizeFields = SANITIZED_FIELDS,
    { withDeps = true } = {}
  ) {
    if (!user) {
      throw new Error("no user given");
    }
    let sanitizedParams = _.pick(user, ...sanitizeFields);
    sanitizedParams.academicInstitute =
      academicInstitutesMap[sanitizedParams.academicInstitute] || "Unknown";

    if (withDeps) {
      const role = await user.$get("role");
      const team: Team = user.team || ((await user.$get("team")) as Team);

      sanitizedParams.role = _.get(role, "name") || "Unavailable";
      sanitizedParams.team = await TeamService.sanitize(team);
    }

    return sanitizedParams;
  }

  private static validateUserParams(params: any, sanitizedFields = SANITIZED_FIELDS): void {
    const intersectedKeys = _.difference(Object.keys(params), _.values(sanitizedFields));
    if (intersectedKeys.length > 0) {
      throw new Error(`Params: ${intersectedKeys.join(",")} are not allowed.`);
    }
  }

  public static async getByIds(userIds: number[]): Promise<User[]> {
    return User.findAll({ where: { id: { $in: userIds } } }).catch(err => {
      console.log("Error fetching users", err);
      return [];
    });
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
    try {
      const { id: teamId } = team || (await TeamService.findOneByCode(codeNumber));

      await user.update({ teamId });
    } catch (err) {
      console.log(err);
      throw err;
    }
    return user;
  }

  public static async updateCV({ user, fileParams }: { user: any; fileParams: any }) {
    // console.log("Uplading", fileParams.mimetype, fileParams.name);
    if (fileParams.mimetype !== "application/pdf") {
      throw new Error("File type is not PDF");
    }

    // in MB
    if (fileParams.data.byteLength / 1000000 >= 5) {
      throw new Error("File size is greater than 5 Mb");
    }

    await user.update({ cvFile: fileParams.data });
  }

  public static async verifyPassword(user: User, password: string) {
    try {
      const isMatch = await comparePassword(password, user.password);

      // update AuthToken
      if (isMatch) {
        await user.update({ authToken: uuidv4() });
      } else {
        await user.update({ authToken: null });
      }
      return isMatch;
    } catch (err) {
      console.log(`failed to log in judge ${user.email}`);
      throw err;
    }
  }

  public static async createPasswordForUser(user: User, newPassword: string) {
    const newHashedPassword: string = await encryptPassword(newPassword);
    await user.update({ password: newHashedPassword });
  }

  public static async findById(
    id: number,
    { includeDeps = false }: { includeDeps?: boolean } = {}
  ): Promise<User> {
    let includes = [];
    if (includeDeps) {
      includes = [{ model: Team, required: false }, { model: Role, required: false }];
    }
    const user = await User.findOne({
      where: { id },
      include: includes
    });
    return user;
  }

  public static async findByEmail(email: string): Promise<User> {
    return await User.findOne({
      where: { email }
    });
  }

  public static async deleteUser(id: number) {
    const user = await User.findById(id);
    user.updateAttributes({ isDeleted: true });
  }

  public static cvFilename(user: { id: number; name: string }) {
    const userName = _.snakeCase(user.name.replace(/[^0-9a-z\s]/gi, ""));
    return `${userName}_${user.id}_cvFile.pdf`;
  }

  private static async updateLinkedInImage(user: User, userPicture: any) {
    await user.updateAttributes({ userPicture });
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
