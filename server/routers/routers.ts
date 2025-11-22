import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { authRouter } from "./routers/auth";
import { organizationsRouter } from "./routers/organizations";
import { usersRouter } from "./routers/users";
import { clientsRouter } from "./routers/clients";
import { accountsRouter } from "./routers/accounts";
import { activitiesRouter } from "./routers/activities";
import { tasksRouter } from "./routers/tasks";
import { playbooksRouter } from "./routers/playbooks";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    // Custom auth procedures
    login: authRouter.login,
    getCurrentUser: authRouter.getCurrentUser,
    initializeSuperAdmin: authRouter.initializeSuperAdmin,
  }),
  organizations: organizationsRouter,
  users: usersRouter,
  clients: clientsRouter,
  accounts: accountsRouter,
  activities: activitiesRouter,
  tasks: tasksRouter,
  playbooks: playbooksRouter,
});

export type AppRouter = typeof appRouter;
