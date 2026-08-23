import { prisma, Prisma } from "@trymatcha/database";
import {
    OutboundSocketMessageType,
    type MemberNotificationType,
    type ProjectNotificationType,
} from "@trymatcha/types";
import { server_services } from "..";

type NotificationPayload = Prisma.InputJsonObject;

type NotificationInput =
    | {
          scope: "project";
          userId: string;
          projectId: string;
          type: ProjectNotificationType;
          payload: NotificationPayload;
      }
    | {
          scope: "member";
          userId: string;
          type: MemberNotificationType;
          payload: NotificationPayload;
      };

export default class NotificationCreateService {
    static async create(input: NotificationInput) {
        const notification = await prisma.notification.create({
            data: {
                userId: input.userId,
                projectId: input.scope === "project" ? input.projectId : null,
                type: input.type,
                payload: input.payload,
            },
        });

        await server_services.publisher.publish_message(
            server_services.publisher.get_user_channel_name(notification.userId),
            JSON.stringify({
                type: OutboundSocketMessageType.NOTIFICATION_CREATED,
                payload: notification,
            }),
        );

        return notification;
    }
}
