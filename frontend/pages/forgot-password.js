import { useState } from "react";
import Head from "next/head";
import Link from "next/link";

import styles from "../styles/Login.module.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [success, setSuccess] =
    useState("");

  const [error, setError] =
    useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/auth/forgot-password",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            email: email.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to process your request"
        );
      }

      setSuccess(
        "If an account exists with this email, a reset link has been generated. Check the backend terminal."
      );
    } catch (error) {
      console.error(
        "Forgot password error:",
        error
      );

      setError(
        error.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>
          Forgot Password | CollegeGPT
        </title>

        <meta
          name="description"
          content="Reset your CollegeGPT password"
        />
      </Head>

      <main className={styles.page}>
        <div className={styles.background}>
          <div
            className={`${styles.glow} ${styles.glowOne}`}
          ></div>

          <div
            className={`${styles.glow} ${styles.glowTwo}`}
          ></div>

          <div
            className={`${styles.glow} ${styles.glowThree}`}
          ></div>

          <div
            className={styles.grid}
          ></div>
        </div>

        <section className={styles.card}>
          <div className={styles.brand}>
            <div
              className={styles.brandIcon}
            >
              ✦
            </div>

            <span>
              CollegeGPT
            </span>
          </div>

          <div className={styles.header}>
            <p
              className={styles.eyebrow}
            >
              ACCOUNT RECOVERY
            </p>

            <h1
              className={styles.title}
            >
              Reset your password.
            </h1>

            <p
              className={styles.subtitle}
            >
              Enter your email and we'll
              help you get back into your
              account.
            </p>
          </div>

          <form
            className={styles.form}
            onSubmit={handleSubmit}
          >
            <div
              className={styles.inputGroup}
            >
              <label htmlFor="email">
                Email address
              </label>

              <input
                className={styles.input}
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
              />
            </div>

            {error && (
              <div
                style={{
                  color: "#ff7777",
                  fontSize: "13px",
                  marginTop: "4px",
                }}
              >
                {error}
              </div>
            )}

            {success && (
              <div
                style={{
                  color: "#72e6a3",
                  fontSize: "13px",
                  lineHeight: 1.5,
                  marginTop: "4px",
                }}
              >
                {success}
              </div>
            )}

            <button
              type="submit"
              className={styles.button}
              disabled={loading}
            >
              <span
                className={
                  styles.buttonContent
                }
              >
                <span>
                  {loading
                    ? "Generating..."
                    : "Reset password"}
                </span>

                <span
                  className={styles.arrow}
                >
                  →
                </span>
              </span>
            </button>
          </form>

          <p className={styles.signup}>
            Remember your password?{" "}
            <Link href="/login">
              Back to login
            </Link>
          </p>

          <p
            className={styles.security}
          >
            <span>●</span>

            Secure password recovery
          </p>
        </section>
      </main>
    </>
  );
}