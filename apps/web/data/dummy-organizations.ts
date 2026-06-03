import type { Organization } from "@/types/organization";

/**
 * Placeholder organizations for building the playground UI while the database
 * is empty. Swap this for `useFetchOrganizations()` once real data is available.
 */
export const dummyOrganizations: Organization[] = [
    {
        id: "org_1",
        name: "Acme Labs",
        slug: "acme-labs",
        description:
            "Core platform team shipping the autonomous engineering runners and the agent orchestration layer.",
        createdAt: "2025-09-12T10:00:00.000Z",
        memberCount: 24,
        projectCount: 7,
        role: "Owner",
    },
    {
        id: "org_2",
        name: "Northwind",
        slug: "northwind",
        description: "Internal tooling and developer experience for the data org.",
        createdAt: "2026-04-21T08:30:00.000Z",
        memberCount: 9,
        projectCount: 3,
        role: "Admin",
    },
    {
        id: "org_3",
        name: "Globex Corporation",
        slug: "globex",
        description: null,
        createdAt: "2026-05-28T14:15:00.000Z",
        memberCount: 1,
        projectCount: 1,
        role: "Member",
    },
    {
        id: "org_4",
        name: "Initech",
        slug: "initech",
        description: "Billing, invoicing and revenue operations workspace.",
        createdAt: "2025-12-02T09:45:00.000Z",
        memberCount: 5,
        projectCount: 2,
        role: "Billing",
    },
    {
        id: "org_5",
        name: "Hooli",
        slug: "hooli",
        description:
            "Experimental research group exploring sandboxed code execution, long-horizon planning and self-verifying agents across a large monorepo.",
        createdAt: "2025-06-30T16:20:00.000Z",
        memberCount: 42,
        projectCount: 12,
        role: "Member",
    },
    {
        id: "org_6",
        name: "Stark Industries",
        slug: "stark",
        description: "Frontend platform and design systems.",
        createdAt: "2026-05-31T11:05:00.000Z",
        memberCount: 16,
        projectCount: 5,
        role: "Admin",
    },
];
