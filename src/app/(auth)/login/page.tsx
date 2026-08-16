"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { postIdentityTokenGenerate } from "@/client";
import { client } from "@/client/client.gen";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      client.setConfig({
        baseUrl: (process.env.NEXT_PUBLIC_API_URL || "https://localhost:5003")
      });

      const response = await postIdentityTokenGenerate({
        body: {
          email,
          password
        }
      });
      
      if (response.data?.isSuccess && response.data?.value?.accessToken) {
        localStorage.setItem("token", response.data.value.accessToken);
        // We could also configure the client here:
        // client.setConfig({ headers: { Authorization: \`Bearer \${response.data.value.accessToken}\` } });
        router.push("/products");
      } else {
        const errorMsg = response.data?.errors?.map(e => e.description).filter(Boolean).join(", ") || "Invalid credentials or response format.";
        setError(errorMsg);
      }
    } catch (err: any) {
      setError(err?.body?.message || "An error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div className="glass-panel" style={{ padding: "3rem", width: "100%", maxWidth: "450px" }}>
        
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: "700", marginBottom: "0.5rem" }}>Welcome Back</h1>
          <p style={{ color: "var(--text-secondary)" }}>Sign in to Agecs Licensing</p>
        </div>

        {error && (
          <div style={{ padding: "1rem", backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "8px", color: "#ef4444", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input 
              id="email"
              type="email" 
              className="form-input" 
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: "2.5rem" }}>
            <label className="form-label" htmlFor="password">Password</label>
            <input 
              id="password"
              type="password" 
              className="form-input" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary" style={{ width: "100%" }} disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

      </div>
    </main>
  );
}
