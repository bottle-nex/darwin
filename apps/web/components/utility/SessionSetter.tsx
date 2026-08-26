"use client";

import type { Session } from "next-auth";
import { useEffect } from "react";

import { useUserSessionStore } from "@/store/user/useUserSessionStore";

interface SessionSetterProps {
    session: Session | null;
}

export default function SessionSetter({ session }: SessionSetterProps) {
    const { setSession } = useUserSessionStore();

    useEffect(() => {
        setSession(session);
    }, [session, setSession]);

    return null;
}
