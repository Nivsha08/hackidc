import { Router } from "express";
import * as _ from "lodash";
import { ensureAuthenticated } from "../concerns/auth.users";
import { handleError, handleUnauthorize } from "../routers.helper";
import { TeamService } from "../teams/team.service";
import UserScore from "./user.score";
import { UserService } from "./user.service";
import userUploadsRouter from "./user.upload.router";

const router = new Router();

router.use("/self/uploads", userUploadsRouter);

router.get("/self", ensureAuthenticated, async (req, res) => {
  try {
    const userId: number = Number(_.get(req, "user.id") || req.query.id);
    const user = await UserService.findById(userId, { includeDeps: true });
    const sanitizedUser = await UserService.sanitize(user);

    // temp calculate lazy score
    const userScore = UserScore.calculateScore(user);
    res.json(_.extend(sanitizedUser, { userScore }));
  } catch (err) {
    handleError(err, res);
  }
});

router.post("/register", ensureAuthenticated, async (req, res) => {
  // temp block in production
  if (process.env.NODE_ENV === "production") {
    return handleUnauthorize(new Error("Currently unavailable"), res);
  }
  try {
    const userId = _.get(req, "user.id");

    const user = await UserService.findById(userId);
    const userParams = UserService.extractUserParams(req.body);
    const teamParams = TeamService.extractTeamParams(req.body);

    const updatedUser = await UserService.finishRegistration({
      user,
      userParams,
      teamParams
    });
    const sanitizedUser = await UserService.sanitize(updatedUser);

    res.json({
      user: sanitizedUser
    });
  } catch (err) {
    handleError(err, res);
  }
});

router.delete("/:id", async (req, res) => {
  await UserService.deleteUser(req.params.id);
  res.json({
    isDeleted: true
  });
});

export default router;
