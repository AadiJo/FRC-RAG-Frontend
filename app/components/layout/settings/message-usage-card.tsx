"use client";

import dayjs from "dayjs";
import calendar from "dayjs/plugin/calendar";
import isToday from "dayjs/plugin/isToday";
import isTomorrow from "dayjs/plugin/isTomorrow";
import { Key } from "lucide-react";
import Link from "next/link";
import React, { useCallback } from "react";
import { useUser } from "@/app/providers/user-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

dayjs.extend(calendar);
dayjs.extend(isToday);
dayjs.extend(isTomorrow);

function MessageUsageCardComponent() {
  const { user, rateLimitStatus, apiKeys } = useUser();
  const hasAnyApiKey = apiKeys.length > 0;

  const formatResetDate = useCallback(
    (timestamp: number | null | undefined) => {
      if (!timestamp) {
        return "Not available";
      }
      try {
        const resetDate = dayjs(timestamp);

        return resetDate.calendar(null, {
          sameDay: "[today at] h:mm A",
          nextDay: "[tomorrow at] h:mm A",
          nextWeek() {
            return resetDate.format("MMM D [at] h:mm A");
          },
          lastDay: "[yesterday at] h:mm A",
          lastWeek() {
            return resetDate.format("MMM D [at] h:mm A");
          },
          sameElse() {
            if (resetDate.year() === dayjs().year()) {
              return resetDate.format("MMM D [at] h:mm A");
            }
            return resetDate.format("MMM D, YYYY [at] h:mm A");
          },
        });
      } catch {
        return "Error calculating reset time";
      }
    },
    []
  );

  if (!(user && rateLimitStatus)) {
    return null;
  }

  // If user has API keys, show unlimited message
  if (hasAnyApiKey) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-0.5 space-y-0">
          <CardTitle className="font-semibold text-sm">Message Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-green-400">
            <Key className="size-4" />
            <span className="text-sm">
              Unlimited messages with your API keys
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const resetTimestamp = rateLimitStatus.dailyReset;
  const nextResetDateStr = formatResetDate(resetTimestamp);

  const dailyLimit = rateLimitStatus.dailyLimit;
  const dailyCount = rateLimitStatus.dailyCount;
  const dailyRemaining = rateLimitStatus.dailyRemaining;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-0.5 space-y-0">
        <CardTitle className="font-semibold text-sm">Message Usage</CardTitle>
        <Tooltip>
          <TooltipTrigger asChild>
            <p className="text-muted-foreground text-xs">
              Resets {nextResetDateStr}
            </p>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {resetTimestamp
                ? dayjs(resetTimestamp).format("M/D/YYYY, h:mm:ss A")
                : "Not available"}
            </p>
          </TooltipContent>
        </Tooltip>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span>Daily</span>
            <span>
              {dailyCount} / {dailyLimit}
            </span>
          </div>
          <Progress
            value={
              dailyLimit > 0
                ? Math.min((dailyCount / dailyLimit) * 100, 100)
                : 0
            }
          />
          <p className="mt-1 text-muted-foreground text-xs">
            {dailyRemaining} messages remaining today
          </p>
        </div>
        <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3">
          <p className="text-muted-foreground text-xs">
            <Link
              className="font-medium text-yellow-400 hover:underline"
              href="/settings/api-keys"
            >
              Add your own API keys
            </Link>{" "}
            (free!) to unlock unlimited messages and all models.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export const MessageUsageCard = React.memo(MessageUsageCardComponent);
