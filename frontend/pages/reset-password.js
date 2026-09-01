import {
  useEffect,
  useState,
} from "react";

import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

import styles from "../styles/Login.module.css";

export default function ResetPassword() {
  const router = useRouter();

  const [token, setToken] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [success, setSuccess] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (router.isReady) {
      setToken(
        router.query.token || ""
      );
    }
  }, [
    router.isReady,
    router.query.token,
  ]);

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    setError("");

    if (!token) {
      setError(
        "Invalid password reset link."
      );

      return;
    }

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );

      return;
    }

    if (
      password !== confirmPassword
    ) {
      setError(
        "Passwords do not match."
      );

      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/auth/reset-password",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            token,
            password,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to reset password"
        );
      }

      setSuccess(true);
    } catch (error) {
      console.error(
        "Reset password error:",
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
          Reset Password | CollegeGPT
        </title>

        <meta
          name="description"
          content="Create a new CollegeGPT password"
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

          {!success ? (
            <>
              <div
                className={styles.header}
              >
                <p
                  className={
                    styles.eyebrow
                  }
                >
                  NEW PASSWORD
                </p>

                <h1
                  className={
                    styles.title
                  }
                >
                  Create a new password.
                </h1>

                <p
                  className={
                    styles.subtitle
                  }
                >
                  Choose a new password for
                  your CollegeGPT account.
                </p>
              </div>

              <form
                className={styles.form}
                onSubmit={
                  handleSubmit
                }
              >
                <div
                  className={
                    styles.inputGroup
                  }
                >
                  <label htmlFor="password">
                    New password
                  </label>

                  <input
                    className={
                      styles.input
                    }
                    id="password"
                    type="password"
                    placeholder="Enter new password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(
                      event
                    ) =>
                      setPassword(
                        event.target
                          .value
                      )
                    }
                  />
                </div>

                <div
                  className={
                    styles.inputGroup
                  }
                >
                  <label htmlFor="confirmPassword">
                    Confirm password
                  </label>

                  <input
                    className={
                      styles.input
                    }
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    value={
                      confirmPassword
                    }
                    onChange={(
                      event
                    ) =>
                      setConfirmPassword(
                        event.target
                          .value
                      )
                    }
                  />
                </div>

                {error && (
                  <div
                    style={{
                      color:
                        "#ff7777",
                      fontSize:
                        "13px",
                      lineHeight:
                        1.5,
                    }}
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className={
                    styles.button
                  }
                  disabled={loading}
                >
                  <span
                    className={
                      styles.buttonContent
                    }
                  >
                    <span>
                      {loading
                        ? "Updating..."
                        : "Set new password"}
                    </span>

                    <span
                      className={
                        styles.arrow
                      }
                    >
                      →
                    </span>
                  </span>
                </button>
              </form>
            </>
          ) : (
            <>
              <div
                className={styles.header}
              >
                <p
                  className={
                    styles.eyebrow
                  }
                >
                  SUCCESS
                </p>

                <h1
                  className={
                    styles.title
                  }
                >
                  Password updated.
                </h1>

                <p
                  className={
                    styles.subtitle
                  }
                >
                  Your CollegeGPT password
                  has been changed
                  successfully.
                </p>
              </div>

              <Link
                href="/login"
                className={
                  styles.button
                }
                style={{
                  display: "block",
                  textDecoration:
                    "none",
                }}
              >
                <span
                  className={
                    styles.buttonContent
                  }
                >
                  <span>
                    Back to login
                  </span>

                  <span
                    className={
                      styles.arrow
                    }
                  >
                    →
                  </span>
                </span>
              </Link>
            </>
          )}

          <p className={styles.security}>
            <span>●</span>

            Secure password recovery
          </p>
        </section>
      </main>
    </>
  );
}