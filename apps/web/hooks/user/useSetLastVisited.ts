import { useMutation } from "@tanstack/react-query";

import { apiClient } from "@/lib/axios";
import { LAST_VISITED_URL } from "@/routes/api_routes";
import type { LastVisited } from "@/types/user";

export function useSetLastVisited() {
    return useMutation({
        mutationFn: async (input: LastVisited) => {
            await apiClient.patch(LAST_VISITED_URL, input);
        },
    });
}
