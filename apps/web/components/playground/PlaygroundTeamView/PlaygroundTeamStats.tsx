"use client";
import { LayoutGrid, MoreVertical } from "lucide-react";
import { useGetTeamMembers } from "@/hooks/team/useGetTeamMembers";

function plural(count: number, word: string) {
    return `${word}${count === 1 ? "" : "s"}`;
}

export default function PlaygroundTeamStats({ teamId }: { teamId: string }) {
    const { data, isLoading } = useGetTeamMembers(teamId);

    const members = data?.members ?? [];
    const maintainers = members.filter((m) => m.role === "Maintainer").length;
    const regular = members.length - maintainers;
    const pendingInvites = data?.pendingInvites ?? 0;

    const stats = [
        {
            id: "total",
            label: "Total Members",
            value: members.length,
            unit: plural(members.length, "member"),
            caption: "In this team",
        },
        {
            id: "maintainers",
            label: "Maintainers",
            value: maintainers,
            unit: plural(maintainers, "maintainer"),
            caption: "Can manage the team",
        },
        {
            id: "members",
            label: "Members",
            value: regular,
            unit: plural(regular, "member"),
            caption: "Standard access",
        },
        {
            id: "pending",
            label: "Pending Invites",
            value: pendingInvites,
            unit: plural(pendingInvites, "invite"),
            caption: "Awaiting response",
        },
    ];

    return (
        <section className="rounded-xl ring-1 ring-white/5 bg-charcoal p-3">
            <div className="mb-3 flex items-center gap-2">
                <LayoutGrid className="size-4 text-neutral-400" aria-hidden />
                <h3 className="text-[15px] font-medium text-neutral-100">Team Members</h3>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {isLoading
                    ? [0, 1, 2, 3].map((i) => (
                          <div key={i} className="h-[92px] animate-pulse rounded-xl bg-white/2" />
                      ))
                    : stats.map((stat) => (
                          <div
                              key={stat.id}
                              className="rounded-xl border border-white/5 bg-white/2 p-3 px-4"
                          >
                              <div className="flex items-start justify-between">
                                  <p className="text-[12px] text-neutral-500">{stat.label}</p>
                                  <div className="group flex size-6 cursor-pointer items-center justify-center rounded-sm transition-colors duration-200 hover:bg-neutral-800/70">
                                      <MoreVertical
                                          className="size-4 text-neutral-600 transition-colors duration-200 group-hover:text-neutral-300"
                                          aria-hidden
                                      />
                                  </div>
                              </div>

                              <p className="mt-1.5">
                                  <span className="text-[19px] font-semibold text-neutral-100">
                                      {stat.value}
                                  </span>
                                  <span className="ml-1.5 text-[14px] text-neutral-400">
                                      {stat.unit}
                                  </span>
                              </p>
                              <p className="mt-0.5 text-[12px] text-neutral-500">{stat.caption}</p>
                          </div>
                      ))}
            </div>
        </section>
    );
}
