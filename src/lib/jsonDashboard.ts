import { buildJsonFormatterSummary } from "../dashboard/summary";
import { pushAppStarterActivity } from "./pushActivity";

export const pushJsonFormatterDashboardUpdate = async (params: {
  userId: string;
  event: string;
  entityId?: string;
}) => {
  const summary = await buildJsonFormatterSummary(params.userId);

  await pushAppStarterActivity({
    userId: params.userId,
    activity: {
      event: params.event,
      entityId: params.entityId,
      occurredAt: new Date().toISOString(),
    },
    summary,
  });

  return summary;
};
