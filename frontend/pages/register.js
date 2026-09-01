import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "../styles/Register.module.css";

export default function Register() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Unable to create your account.");
        return;
      }

      setSuccess("Account created successfully!");

      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch (error) {
      console.error("Registration request failed:", error);
      setError(
        "Unable to connect to the server. Please make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Create Account | CollegeGPT</title>
        <meta
          name="description"
          content="Create your CollegeGPT account"
        />
      </Head>

      <main className={styles.page}>
        <div className={styles.background}>
          <div className={`${styles.glow} ${styles.glowOne}`}></div>
          <div className={`${styles.glow} ${styles.glowTwo}`}></div>
          <div className={`${styles.glow} ${styles.glowThree}`}></div>
          <div className={styles.grid}></div>
        </div>

        <section className={styles.card}>
          <div className={styles.brand}>
            <div className={styles.brandIcon}>✦</div>
            <span>CollegeGPT</span>
          </div>

          <div className={styles.header}>
            <p className={styles.eyebrow}>GET STARTED</p>

            <h1 className={styles.title}>
              Your campus,
              <br />
              <span>one conversation away.</span>
            </h1>

            <p className={styles.subtitle}>
              Create your account and make CollegeGPT your
              personal campus assistant.
            </p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
              <label htmlFor="name">Full name</label>

              <input
                className={styles.input}
                id="name"
                type="text"
                placeholder="Enter your full name"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="email">Email address</label>

              <input
                className={styles.input}
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="password">Password</label>

              <div className={styles.passwordWrapper}>
                <input
                  className={styles.input}
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />

                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="confirmPassword">
                Confirm password
              </label>

              <div className={styles.passwordWrapper}>
                <input
                  className={styles.input}
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                />

                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error && (
              <div className={styles.errorMessage}>
                {error}
              </div>
            )}

            {success && (
              <div className={styles.successMessage}>
                {success}
              </div>
            )}

            <button
              type="submit"
              className={styles.button}
              disabled={loading}
            >
              <span className={styles.buttonContent}>
                <span>
                  {loading ? "Creating account..." : "Create account"}
                </span>

                {!loading && (
                  <span className={styles.arrow}>→</span>
                )}
              </span>
            </button>
          </form>

          <div className={styles.divider}>
            <span>already have an account?</span>
          </div>

          <p className={styles.loginText}>
            <Link href="/login">Sign in to CollegeGPT</Link>
          </p>

          <p className={styles.security}>
            <span>●</span>
            Your account is securely protected
          </p>
        </section>
      </main>
    </>
  );
}