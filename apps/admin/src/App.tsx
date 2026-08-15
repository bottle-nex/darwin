import { Navigate, Route, Routes } from "react-router-dom";
import AdminSession from "./lib/session";
import Login from "./routes/Login";
import PostList from "./routes/PostList";
import PostEditor from "./routes/PostEditor";

function RequireAdmin({ children }: { children: React.ReactNode }) {
    if (!AdminSession.is_authenticated()) {
        return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
}

export default function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route
                path="/"
                element={
                    <RequireAdmin>
                        <PostList />
                    </RequireAdmin>
                }
            />
            <Route
                path="/posts/new"
                element={
                    <RequireAdmin>
                        <PostEditor />
                    </RequireAdmin>
                }
            />
            <Route
                path="/posts/:id"
                element={
                    <RequireAdmin>
                        <PostEditor />
                    </RequireAdmin>
                }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
