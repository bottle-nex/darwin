"use client";
import { useEffect, useState } from "react";

import { get_active_socket_client } from "@/socket/singleton.socket";

export function useSocketConnection(project_id: string | undefined) {
    const [is_connected, set_is_connected] = useState(
        () => get_active_socket_client()?.is_connected ?? false,
    );

    useEffect(() => {
        const client = get_active_socket_client();
        if (!client) return;

        client.add_connection_state_handler(set_is_connected);
        return () => client.remove_connection_state_handler(set_is_connected);
    }, [project_id]);

    return is_connected;
}
