import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { GoogleLogin } from "@react-oauth/google";

import styles from "../styles/Login.module.css";

const API_BASE =
  typeof window !== "undefined" &&
  window.location.hostname !== "localhost"
    ? "https://collegegpt-backend-xurq.onrender.com"
    : "http://localhost:5000";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] =
    useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem(
      "collegegpt_token"
    );

    if (token) {
      router.replace("/");
    }
  }, [router]);

  /*
   * Save authenticated user information
   * and redirect to CollegeGPT.
   */
  const saveLoginSession = (data) => {
    if (!data.token) {
      throw new Error(
        "Login succeeded but no authentication token was returned."
      );
    }

    localStorage.setItem(
      "collegegpt_token",
      data.token
    );

    if (data.user) {
      localStorage.setItem(
        "collegegpt_user",
        JSON.stringify(data.user)
      );
    }

    localStorage.removeItem(
      "collegegpt_active_conversation"
    );

    router.replace("/");
  };

  /*
   * Email + Password Login
   */
  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    const cleanEmail =
      email.trim().toLowerCase();

    if (!cleanEmail) {
      setError(
        "Please enter your email address."
      );
      return;
    }

    if (!password) {
      setError(
        "Please enter your password."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE}/api/auth/login`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            email: cleanEmail,
            password,
          }),
        }
      );

      const responseText =
        await response.text();

      let data = {};

      try {
        data = responseText
          ? JSON.parse(responseText)
          : {};
      } catch (parseError) {
        console.error(
          "Login returned non-JSON:",
          responseText
        );

        throw new Error(
          `Backend returned an invalid response (${response.status})`
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to sign in. Please check your credentials."
        );
      }

      saveLoginSession(data);
    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      setError(
        error.message ||
          "Something went wrong while signing in."
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * Google Login
   */
  const handleGoogleSuccess = async (
    credentialResponse
  ) => {
    setError("");
    setGoogleLoading(true);

    try {
      if (
        !credentialResponse?.credential
      ) {
        throw new Error(
          "Google did not return a valid authentication credential."
        );
      }

      const response = await fetch(
        `${API_BASE}/api/auth/google`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            credential:
              credentialResponse.credential,
          }),
        }
      );

      const responseText =
        await response.text();

      let data = {};

      try {
        data = responseText
          ? JSON.parse(responseText)
          : {};
      } catch (parseError) {
        console.error(
          "Google login returned non-JSON:",
          responseText
        );

        throw new Error(
          `Backend returned an invalid response (${response.status})`
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Google login failed. Please try again."
        );
      }

      saveLoginSession(data);
    } catch (error) {
      console.error(
        "Google login error:",
        error
      );

      setError(
        error.message ||
          "Unable to sign in with Google."
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    console.error(
      "Google Login failed"
    );

    setError(
      "Google login was cancelled or failed. Please try again."
    );

    setGoogleLoading(false);
  };

  return (
    <>
      <Head>
        <title>
          Login | CollegeGPT
        </title>

        <meta
          name="description"
          content="Sign in to your CollegeGPT account."
        />
      </Head>

      <main className={styles.page}>
        <div
          className={styles.background}
          aria-hidden="true"
        >
          <div
            className={`${styles.glow} ${styles.glowOne}`}
          />

          <div
            className={`${styles.glow} ${styles.glowTwo}`}
          />

          <div
            className={`${styles.glow} ${styles.glowThree}`}
          />

          <div className={styles.grid} />
        </div>

        <section
          className={styles.authCard}
        >
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

          <div className={styles.heading}>
            <span
              className={styles.eyebrow}
            >
              WELCOME BACK
            </span>

            <h1>
              Let&apos;s get you
              <span>
                back in.
              </span>
            </h1>

            <p>
              Your campus knowledge
              is waiting.
            </p>
          </div>

          <form
            className={styles.form}
            onSubmit={handleSubmit}
          >
            <div
              className={styles.field}
            >
              <label htmlFor="email">
                Email address
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(
                    event.target.value
                  );
                  setError("");
                }}
                placeholder="you@example.com"
                autoComplete="email"
                disabled={
                  loading ||
                  googleLoading
                }
              />
            </div>

            <div
              className={styles.field}
            >
              <div
                className={
                  styles.passwordLabel
                }
              >
                <label htmlFor="password">
                  Password
                </label>

                <Link
                  href="/forgot-password"
                >
                  Forgot password?
                </Link>
              </div>

              <div
                className={
                  styles.passwordWrapper
                }
              >
                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) => {
                    setPassword(
                      event.target.value
                    );
                    setError("");
                  }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={
                    loading ||
                    googleLoading
                  }
                />

                <button
                  type="button"
                  className={
                    styles.passwordToggle
                  }
                  onClick={() =>
                    setShowPassword(
                      (value) => !value
                    )
                  }
                  disabled={
                    loading ||
                    googleLoading
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword
                    ? "Hide"
                    : "Show"}
                </button>
              </div>
            </div>

            {error && (
              <div
                className={
                  styles.errorMessage
                }
              >
                <span>!</span>

                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              className={
                styles.submitButton
              }
              disabled={
                loading ||
                googleLoading
              }
            >
              {loading ? (
                <>
                  <span
                    className={
                      styles.spinner
                    }
                  />

                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <span>→</span>
                </>
              )}
            </button>
          </form>

          <div
            className={styles.divider}
          >
            <span />
            <small>or</small>
            <span />
          </div>

          <div
            className={
              styles.socialButtons
            }
          >
            <div
              className={
                styles.googleButtonWrapper
              }
            >
              {googleLoading ? (
                <button
                  type="button"
                  className={
                    styles.socialButton
                  }
                  disabled
                >
                  <span
                    className={
                      styles.spinner
                    }
                  />

                  Connecting to Google...
                </button>
              ) : (
                <GoogleLogin
                  onSuccess={
                    handleGoogleSuccess
                  }
                  onError={
                    handleGoogleError
                  }
                  useOneTap={false}
                  theme="filled_black"
                  size="large"
                  text="continue_with"
                  shape="rectangular"
                  width="100%"
                />
              )}
            </div>

            
          </div>

          <p
            className={
              styles.createAccount
            }
          >
            Don&apos;t have an account?{" "}
            <Link href="/register">
              Create one
            </Link>
          </p>

          <div
            className={styles.security}
          >
            <span />
            Secure student
            authentication
          </div>
        </section>

        <div
          className={styles.cornerBrand}
        >
          N
        </div>
      </main>
    </>
  );
}