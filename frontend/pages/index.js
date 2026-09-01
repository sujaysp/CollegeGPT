import { useEffect, useMemo, useRef, useState } from "react";

import Head from "next/head";

import { useRouter } from "next/router";

import ReactMarkdown from "react-markdown";

import remarkGfm from "remark-gfm";

import styles from "../styles/Home.module.css";

const API_BASE =

  process.env.NEXT_PUBLIC_API_BASE_URL ||

  "http://localhost:5000";

const getStoredToken = () => {

  if (typeof window === "undefined") {

    return null;

  }

  return localStorage.getItem("collegegpt_token");

};

const parseJsonResponse = async (response) => {

  const text = await response.text();

  console.log("Backend status:", response.status);

  console.log(

    "Backend content-type:",

    response.headers.get("content-type")

  );

  if (!text || !text.trim()) {

    return {};

  }

  try {

    return JSON.parse(text);

  } catch (error) {

    console.error("Unable to parse backend JSON:", text);

    return {

      message: text.trim(),

    };

  }

};

export default function Home() {

  const router = useRouter();

  const messagesEndRef = useRef(null);

  const textareaRef = useRef(null);

  const abortControllerRef = useRef(null);

  const fileInputRef = useRef(null);

  const [user, setUser] = useState(null);

  const [message, setMessage] = useState("");

  const [activeChat, setActiveChat] = useState(null);

  const [conversationId, setConversationId] = useState(null);

  const [messages, setMessages] = useState([]);

  const [conversations, setConversations] = useState([]);

  const [loading, setLoading] = useState(false);

  const [regenerating, setRegenerating] = useState(false);

  const [loadingConversations, setLoadingConversations] =

    useState(true);

  const [loadingConversation, setLoadingConversation] =

    useState(false);

  const [uploadingDocument, setUploadingDocument] =

    useState(false);

  const [uploadedDocuments, setUploadedDocuments] =

    useState([]);

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [mobileSidebarOpen, setMobileSidebarOpen] =

    useState(false);

  const [settingsOpen, setSettingsOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  const [copiedIndex, setCopiedIndex] = useState(null);

  const [renameModalOpen, setRenameModalOpen] =

    useState(false);

  const [deleteModalOpen, setDeleteModalOpen] =

    useState(false);

  const [selectedConversation, setSelectedConversation] =

    useState(null);

  const [selectedDocument, setSelectedDocument] =

    useState(null);

  const [documentModalOpen, setDocumentModalOpen] =

    useState(false);

  const [deletingDocumentId, setDeletingDocumentId] =

    useState(null);

  const [renameTitle, setRenameTitle] = useState("");

  const [editingIndex, setEditingIndex] = useState(null);

  const clearSession = () => {

    if (typeof window === "undefined") {

      return;

    }

    localStorage.removeItem("collegegpt_token");

    localStorage.removeItem("collegegpt_user");

    localStorage.removeItem(

      "collegegpt_active_conversation"

    );

  };

  const goToLogin = () => {

    clearSession();

    router.replace("/login");

  };

  const loadConversations = async (token) => {

    if (!token) {

      return;

    }

    try {

      setLoadingConversations(true);

      const response = await fetch(

        `${API_BASE}/api/conversations`,

        {

          method: "GET",

          headers: {

            Authorization: `Bearer ${token}`,

          },

        }

      );

      const data = await parseJsonResponse(response);

      if (response.status === 401) {

        goToLogin();

        return;

      }

      if (!response.ok) {

        throw new Error(

          data.message ||

            "Unable to load conversations"

        );

      }

      setConversations(

        Array.isArray(data.conversations)

          ? data.conversations

          : []

      );

    } catch (error) {

      console.error(

        "Conversation loading error:",

        error

      );

    } finally {

      setLoadingConversations(false);

    }

  };

  useEffect(() => {

    if (typeof window === "undefined") {

      return;

    }

    const token =

      localStorage.getItem("collegegpt_token");

    const storedUser =

      localStorage.getItem("collegegpt_user");

    if (!token) {

      router.replace("/login");

      return;

    }

    if (storedUser) {

      try {

        setUser(JSON.parse(storedUser));

      } catch (error) {

        console.error(

          "Unable to parse stored user:",

          error

        );

        localStorage.removeItem("collegegpt_user");

      }

    }

    const storedDocuments =

      localStorage.getItem(

        "collegegpt_uploaded_documents"

      );

    if (storedDocuments) {

      try {

        const parsedDocuments =

          JSON.parse(storedDocuments);

        if (Array.isArray(parsedDocuments)) {

          setUploadedDocuments(parsedDocuments);

        }

      } catch (error) {

        console.error(

          "Unable to restore uploaded documents:",

          error

        );

        localStorage.removeItem(

          "collegegpt_uploaded_documents"

        );

      }

    }

    loadConversations(token);

  }, [router]);

  const openConversation = async (conversation) => {

    if (!conversation?._id) {

      return;

    }

    const token = getStoredToken();

    if (!token) {

      goToLogin();

      return;

    }

    try {

      setLoadingConversation(true);

      const response = await fetch(

        `${API_BASE}/api/conversations/${conversation._id}`,

        {

          method: "GET",

          headers: {

            Authorization: `Bearer ${token}`,

          },

        }

      );

      const data =

        await parseJsonResponse(response);

      if (response.status === 401) {

        goToLogin();

        return;

      }

      if (!response.ok) {

        throw new Error(

          data.message ||

            "Unable to load conversation"

        );

      }

      const loaded = data.conversation;

      if (!loaded) {

        throw new Error(

          "Conversation data was not returned by the backend."

        );

      }

      setConversationId(loaded._id);

      setActiveChat(

        loaded.title || "Conversation"

      );

      setMessages(

        Array.isArray(loaded.messages)

          ? loaded.messages

          : []

      );

      setMessage("");

      setEditingIndex(null);

      setMobileSidebarOpen(false);

      localStorage.setItem(

        "collegegpt_active_conversation",

        loaded._id

      );

    } catch (error) {

      console.error(

        "Open conversation error:",

        error

      );

    } finally {

      setLoadingConversation(false);

    }

  };

  useEffect(() => {

    if (typeof window === "undefined") {

      return;

    }

    const savedConversationId =

      localStorage.getItem(

        "collegegpt_active_conversation"

      );

    if (

      !savedConversationId ||

      conversations.length === 0 ||

      conversationId ||

      loadingConversation

    ) {

      return;

    }

    const savedConversation =

      conversations.find(

        (item) =>

          item._id === savedConversationId

      );

    if (savedConversation) {

      openConversation(savedConversation);

    }

  }, [

    conversations,

    conversationId,

    loadingConversation,

  ]);

  useEffect(() => {

    messagesEndRef.current?.scrollIntoView({

      behavior: "smooth",

    });

  }, [messages, loading, regenerating]);

  useEffect(() => {

    if (!textareaRef.current) {

      return;

    }

    textareaRef.current.style.height = "auto";

    textareaRef.current.style.height =

      `${Math.min(

        textareaRef.current.scrollHeight,

        180

      )}px`;

  }, [message]);

  const filteredConversations = useMemo(() => {

    const value =

      searchTerm.trim().toLowerCase();

    if (!value) {

      return conversations;

    }

    return conversations.filter(

      (item) =>

        item.title

          ?.toLowerCase()

          .includes(value)

    );

  }, [conversations, searchTerm]);

  const startNewChat = () => {

    if (loading || regenerating) {

      return;

    }

    setActiveChat(null);

    setConversationId(null);

    setMessages([]);

    setMessage("");

    setSearchTerm("");

    setEditingIndex(null);

    setMobileSidebarOpen(false);

    if (typeof window !== "undefined") {

      localStorage.removeItem(

        "collegegpt_active_conversation"

      );

    }

    setTimeout(() => {

      textareaRef.current?.focus();

    }, 50);

  };

  const handleLogout = () => {

    clearSession();

    router.push("/login");

  };

  const handleSuggestion = (text) => {

    setMessage(text);

    setTimeout(() => {

      textareaRef.current?.focus();

    }, 50);

  };

  /*

   * ============================================================

   * PDF UPLOAD

   * ============================================================

   */

  const uploadDocument = async (file) => {

    if (!file) {

      return;

    }

    if (file.type !== "application/pdf") {

      alert("Please select a PDF file.");

      return;

    }

    if (file.size > 10 * 1024 * 1024) {

      alert("PDF must be smaller than 10 MB.");

      return;

    }

    const token = getStoredToken();

    if (!token) {

      goToLogin();

      return;

    }

    setUploadingDocument(true);

    try {

      const formData = new FormData();

      formData.append("file", file);

      const response = await fetch(

        `${API_BASE}/api/documents/upload`,

        {

          method: "POST",

          headers: {

            Authorization: `Bearer ${token}`,

          },

          body: formData,

        }

      );

      const data = await parseJsonResponse(response);

      if (response.status === 401) {

        goToLogin();

        return;

      }

      if (!response.ok) {

        throw new Error(

          data.message ||

            "Unable to upload document"

        );

      }

      if (data.document) {

        setUploadedDocuments((previous) => {

          const updated = [

            data.document,

            ...previous.filter(

              (item) =>

                (item._id || item.id) !==

                (data.document._id || data.document.id)

            ),

          ];

          if (typeof window !== "undefined") {

            localStorage.setItem(

              "collegegpt_uploaded_documents",

              JSON.stringify(updated)

            );

          }

          return updated;

        });

      }

      console.log(

        "PDF uploaded successfully:",

        data.document

      );

    } catch (error) {

      console.error(

        "Document upload error:",

        error

      );

      alert(

        error?.message ||

          "Something went wrong while uploading the PDF."

      );

    } finally {

      setUploadingDocument(false);

      if (fileInputRef.current) {

        fileInputRef.current.value = "";

      }

    }

  };

  /*
   * ============================================================
   * OPEN PDF
   * ============================================================
   *
   * IMPORTANT:
   * The PDF tab is opened synchronously from the click handler.
   * This prevents Chrome/Edge from treating it as a blocked
   * popup after the asynchronous API request completes.
   *
   * Backend endpoint:
   * GET /api/documents/:id/file
   */

  const openDocument = async (document) => {
    if (!document?._id) {
      return;
    }

    const token = getStoredToken();

    if (!token) {
      goToLogin();
      return;
    }

    let pdfWindow = null;
    let pdfUrl = null;

    try {
      /*
       * Open the tab BEFORE await fetch().
       * This is the key fix for the popup warning.
       */
      pdfWindow = window.open(
        "about:blank",
        "_blank"
      );

      if (!pdfWindow) {
        window.alert(
          "The browser blocked the PDF popup. Please allow popups for localhost:3000 and try again."
        );
        return;
      }

      /*
       * Show a small loading page while the protected
       * PDF request is being completed.
       */
      pdfWindow.document.title = "Opening PDF...";
      pdfWindow.document.body.innerHTML = `
        <div style="
          font-family: Arial, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          background: #0b0a14;
          color: white;
          font-size: 16px;
        ">
          Opening PDF...
        </div>
      `;

      setMobileSidebarOpen(false);

      const response = await fetch(
        `${API_BASE}/api/documents/${document._id}/file`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        pdfWindow.close();
        goToLogin();
        return;
      }

      if (!response.ok) {
        let errorMessage = "Unable to open PDF.";

        try {
          const errorData = await response.json();

          errorMessage =
            errorData.message ||
            errorData.error ||
            errorMessage;
        } catch {
          // The backend did not return JSON.
        }

        throw new Error(errorMessage);
      }

      const blob = await response.blob();

      if (!blob || blob.size === 0) {
        throw new Error("The PDF file is empty.");
      }

      pdfUrl = URL.createObjectURL(blob);

      /*
       * Navigate the already-opened tab to the PDF.
       * No second window.open() is used here.
       */
      pdfWindow.location.href = pdfUrl;

      /*
       * Keep the blob URL alive long enough for the browser's
       * PDF viewer to load it.
       */
      setTimeout(() => {
        if (pdfUrl) {
          URL.revokeObjectURL(pdfUrl);
        }
      }, 60000);
    } catch (error) {
      console.error(
        "Open document error:",
        error
      );

      if (pdfWindow && !pdfWindow.closed) {
        pdfWindow.close();
      }

      window.alert(
        error?.message ||
          "Unable to open the PDF."
      );
    }
  };

  const closeDocumentModal = () => {

    setDocumentModalOpen(false);
    setSelectedDocument(null);
  };

  const formatDocumentSize = (bytes) => {

    if (!bytes || Number.isNaN(Number(bytes))) {
      return "Size unavailable";
    }

    const value = Number(bytes);

    if (value < 1024) {
      return `${value} B`;
    }

    if (value < 1024 * 1024) {
      return `${(value / 1024).toFixed(1)} KB`;
    }

    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  };

  /*
   * ============================================================
   * DELETE PDF
   * ============================================================
   *
   * Backend endpoint:
   * DELETE /api/documents/:id
   */

  const deleteDocument = async (document) => {
    if (!document?._id) {
      return;
    }

    const documentName =
      document.originalName ||
      document.filename ||
      document.name ||
      "this PDF";

    const confirmed = window.confirm(
      `Delete "${documentName}"?\n\nThis will permanently remove the PDF from your CollegeGPT documents.`
    );

    if (!confirmed) {
      return;
    }

    const token = getStoredToken();

    if (!token) {
      goToLogin();
      return;
    }

    const deletedId = document._id;

    try {
      setDeletingDocumentId(deletedId);

      const response = await fetch(
        `${API_BASE}/api/documents/${deletedId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await parseJsonResponse(response);

      if (response.status === 401) {
        goToLogin();
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to delete document."
        );
      }

      setUploadedDocuments((previous) => {
        const updated = previous.filter(
          (item) =>
            (item._id || item.id) !== deletedId
        );

        if (typeof window !== "undefined") {
          localStorage.setItem(
            "collegegpt_uploaded_documents",
            JSON.stringify(updated)
          );
        }

        return updated;
      });

      if (
        selectedDocument?._id === deletedId
      ) {
        setSelectedDocument(null);
        setDocumentModalOpen(false);
      }
    } catch (error) {
      console.error(
        "Delete document error:",
        error
      );

      window.alert(
        error?.message ||
          "Unable to delete document."
      );
    } finally {
      setDeletingDocumentId(null);
    }
  };

  const renameConversation = (conversation) => {

    if (!conversation) {

      return;

    }

    setSelectedConversation(conversation);

    setRenameTitle(conversation.title || "");

    setRenameModalOpen(true);

  };

  const closeRenameModal = () => {

    setRenameModalOpen(false);

    setSelectedConversation(null);

    setRenameTitle("");

  };

  const saveRenamedConversation = async () => {

    const newTitle = renameTitle.trim();

    if (!newTitle || !selectedConversation) {

      return;

    }

    const token = getStoredToken();

    if (!token) {

      goToLogin();

      return;

    }

    try {

      const response =

        await fetch(

          `${API_BASE}/api/conversations/${selectedConversation._id}`,

          {

            method: "PATCH",

            headers: {

              "Content-Type":

                "application/json",

              Authorization:

                `Bearer ${token}`,

            },

            body: JSON.stringify({

              title: newTitle,

            }),

          }

        );

      const data =

        await parseJsonResponse(response);

      if (response.status === 401) {

        goToLogin();

        return;

      }

      if (!response.ok) {

        throw new Error(

          data.message ||

            "Unable to rename conversation"

        );

      }

      const updatedConversation =

        data.conversation;

      if (!updatedConversation) {

        throw new Error(

          "Updated conversation was not returned."

        );

      }

      setConversations(

        (previous) =>

          previous.map(

            (item) =>

              item._id ===

              selectedConversation._id

                ? {

                    ...item,

                    title:

                      updatedConversation.title,

                    updatedAt:

                      updatedConversation.updatedAt,

                  }

                : item

          )

      );

      if (

        conversationId ===

        selectedConversation._id

      ) {

        setActiveChat(

          updatedConversation.title

        );

      }

      closeRenameModal();

    } catch (error) {

      console.error(

        "Rename error:",

        error

      );

    }

  };

  const deleteConversation = (conversation) => {

    if (!conversation) {

      return;

    }

    setSelectedConversation(conversation);

    setDeleteModalOpen(true);

  };

  const closeDeleteModal = () => {

    setDeleteModalOpen(false);

    setSelectedConversation(null);

  };

  const confirmDeleteConversation = async () => {

    if (!selectedConversation) {

      return;

    }

    const token = getStoredToken();

    if (!token) {

      goToLogin();

      return;

    }

    const deletedId =

      selectedConversation._id;

    try {

      const response =

        await fetch(

          `${API_BASE}/api/conversations/${deletedId}`,

          {

            method: "DELETE",

            headers: {

              Authorization:

                `Bearer ${token}`,

            },

          }

        );

      const data =

        await parseJsonResponse(response);

      if (response.status === 401) {

        goToLogin();

        return;

      }

      if (!response.ok) {

        throw new Error(

          data.message ||

            "Unable to delete conversation"

        );

      }

      setConversations(

        (previous) =>

          previous.filter(

            (item) =>

              item._id !== deletedId

          )

      );

      closeDeleteModal();

      if (conversationId === deletedId) {

        setActiveChat(null);

        setConversationId(null);

        setMessages([]);

        setMessage("");

        if (typeof window !== "undefined") {

          localStorage.removeItem(

            "collegegpt_active_conversation"

          );

        }

      }

    } catch (error) {

      console.error(

        "Delete error:",

        error

      );

    }

  };

  const copyMessage = async (content, index) => {

    try {

      if (

        typeof navigator === "undefined" ||

        !navigator.clipboard

      ) {

        return;

      }

      await navigator.clipboard.writeText(content);

      setCopiedIndex(index);

      setTimeout(() => {

        setCopiedIndex(null);

      }, 1600);

    } catch (error) {

      console.error(

        "Copy error:",

        error

      );

    }

  };

  const startEditingMessage = (index) => {

    const item = messages[index];

    if (

      !item ||

      item.role !== "user" ||

      loading ||

      regenerating

    ) {

      return;

    }

    setEditingIndex(index);

    setMessage(item.content || "");

    setTimeout(() => {

      textareaRef.current?.focus();

    }, 100);

  };

  const cancelEditing = () => {

    setEditingIndex(null);

    setMessage("");

  };

  const regenerateResponse = async () => {

    if (

      !conversationId ||

      loading ||

      regenerating

    ) {

      return;

    }

    const token = getStoredToken();

    if (!token) {

      goToLogin();

      return;

    }

    setRegenerating(true);

    try {

      const response =

        await fetch(

          `${API_BASE}/api/chat/regenerate`,

          {

            method: "POST",

            headers: {

              "Content-Type":

                "application/json",

              Authorization:

                `Bearer ${token}`,

            },

            body: JSON.stringify({

              conversationId,

            }),

          }

        );

      const data =

        await parseJsonResponse(response);

      if (response.status === 401) {

        goToLogin();

        return;

      }

      if (!response.ok) {

        throw new Error(

          data.message ||

            "Unable to regenerate response"

        );

      }

      if (Array.isArray(data.messages)) {

        setMessages(data.messages);

      }

      if (data.title) {

        setActiveChat(data.title);

      }

      await loadConversations(token);

    } catch (error) {

      console.error(

        "Regenerate error:",

        error

      );

    } finally {

      setRegenerating(false);

    }

  };

  const sendMessage = async (event) => {

    event?.preventDefault();

    const trimmedMessage = message.trim();

    if (

      !trimmedMessage ||

      loading ||

      regenerating

    ) {

      return;

    }

    const token = getStoredToken();

    if (!token) {

      goToLogin();

      return;

    }

    setEditingIndex(null);

    const userMessage = {

      role: "user",

      content: trimmedMessage,

      createdAt:

        new Date().toISOString(),

    };

    setMessages((previous) => [

      ...previous,

      userMessage,

    ]);

    setMessage("");

    setLoading(true);

    const controller =

      new AbortController();

    abortControllerRef.current =

      controller;

    let streamedReply = "";

    let streamedConversationId =

      conversationId;

    let streamedTitle = activeChat;

    try {

      const response =

        await fetch(

          `${API_BASE}/api/chat/message`,

          {

            method: "POST",

            headers: {

              "Content-Type":

                "application/json",

              Authorization:

                `Bearer ${token}`,

              Accept:

                "text/event-stream",

            },

            body: JSON.stringify({

              message:

                trimmedMessage,

              conversationId:

                conversationId || null,

            }),

            signal: controller.signal,

          }

        );

      if (response.status === 401) {

        goToLogin();

        return;

      }

      if (!response.ok) {

        let errorMessage =

          `Backend returned an error (${response.status})`;

        try {

          const errorText =

            await response.text();

          if (errorText) {

            try {

              const errorData =

                JSON.parse(errorText);

              errorMessage =

                errorData.message ||

                errorMessage;

            } catch {

              errorMessage =

                errorText;

            }

          }

        } catch {

          // Keep default error message.

        }

        throw new Error(errorMessage);

      }

      if (!response.body) {

        throw new Error(

          "The server did not return a streaming response."

        );

      }

      const reader =

        response.body.getReader();

      const decoder =

        new TextDecoder("utf-8");

      let buffer = "";

      const processEvent =

        (eventText) => {

          const lines =

            eventText.split(/\r?\n/);

          let eventName =

            "message";

          const dataParts = [];

          for (const line of lines) {

            if (line.startsWith("event:")) {

              eventName =

                line.slice(6).trim();

            }

            if (line.startsWith("data:")) {

              dataParts.push(

                line.slice(5).trim()

              );

            }

          }

          if (dataParts.length === 0) {

            return;

          }

          const dataText =

            dataParts.join("\n");

          let data;

          try {

            data =

              JSON.parse(dataText);

          } catch {

            return;

          }

          if (

            eventName ===

            "conversation"

          ) {

            if (data.conversationId) {

              streamedConversationId =

                data.conversationId;

              setConversationId(

                data.conversationId

              );

              localStorage.setItem(

                "collegegpt_active_conversation",

                data.conversationId

              );

            }

            if (data.title) {

              streamedTitle =

                data.title;

              setActiveChat(

                data.title

              );

            }

            return;

          }

          if (eventName === "token") {

            const content =

              data.content || "";

            if (!content) {

              return;

            }

            streamedReply += content;

            setMessages(

              (previous) => {

                const existingAssistantIndex =

                  previous.findIndex(

                    (item) =>

                      item.role ===

                        "assistant" &&

                      item.streaming ===

                        true

                  );

                if (

                  existingAssistantIndex !==

                  -1

                ) {

                  return previous.map(

                    (item, index) =>

                      index ===

                      existingAssistantIndex

                        ? {

                            ...item,

                            content:

                              streamedReply,

                          }

                        : item

                  );

                }

                return [

                  ...previous,

                  {

                    role:

                      "assistant",

                    content:

                      streamedReply,

                    streaming:

                      true,

                    createdAt:

                      new Date().toISOString(),

                  },

                ];

              }

            );

            return;

          }

          if (eventName === "done") {

            if (data.conversationId) {

              streamedConversationId =

                data.conversationId;

              setConversationId(

                data.conversationId

              );

              localStorage.setItem(

                "collegegpt_active_conversation",

                data.conversationId

              );

            }

            if (data.title) {

              streamedTitle =

                data.title;

              setActiveChat(

                data.title

              );

            }

            setMessages(

              (previous) =>

                previous.map(

                  (item) =>

                    item.streaming

                      ? {

                          ...item,

                          streaming:

                            false,

                        }

                      : item

                )

            );

            return;

          }

          if (eventName === "error") {

            throw new Error(

              data.message ||

                "Something went wrong while generating the AI response."

            );

          }

        };

      while (true) {

        const { value, done } =

          await reader.read();

        if (done) {

          break;

        }

        buffer += decoder.decode(

          value,

          { stream: true }

        );

        const events =

          buffer.split(

            /\r?\n\r?\n/

          );

        buffer =

          events.pop() || "";

        for (

          const eventText of events

        ) {

          if (!eventText.trim()) {

            continue;

          }

          processEvent(eventText);

        }

      }

      buffer += decoder.decode();

      if (buffer.trim()) {

        processEvent(buffer);

      }

      if (!streamedReply.trim()) {

        throw new Error(

          "The AI returned an empty response."

        );

      }

      await loadConversations(

        token

      );

    } catch (error) {

      if (

        error?.name ===

        "AbortError"

      ) {

        console.log(

          "AI generation stopped by user."

        );

        setMessages(

          (previous) =>

            previous.map(

              (item) =>

                item.streaming

                  ? {

                      ...item,

                      streaming:

                        false,

                    }

                  : item

            )

        );

        return;

      }

      console.error(

        "Chat error:",

        error

      );

      setMessages(

        (previous) =>

          previous.map(

            (item) =>

              item.streaming

                ? {

                    ...item,

                    streaming:

                      false,

                  }

                : item

          )

      );

      setMessages((previous) => [

        ...previous,

        {

          role: "assistant",

          content:

            error?.message ||

            "Something went wrong. Please try again.",

          error: true,

          createdAt:

            new Date().toISOString(),

        },

      ]);

    } finally {

      abortControllerRef.current =

        null;

      setLoading(false);

    }

  };

  const stopGenerating = () => {

    if (abortControllerRef.current) {

      abortControllerRef.current.abort();

    }

  };

  if (!user) {

    return (

      <div

        className={

          styles.loadingScreen

        }

      >

        <div

          className={

            styles.loadingOrb

          }

        >

          ✦

        </div>

        <p>

          Preparing your campus workspace...

        </p>

      </div>

    );

  }

  const firstName =

    user.name

      ?.split(" ")[0] ||

    "Student";

  const initials =

    user.name

      ?.split(" ")

      .map(

        (part) =>

          part.charAt(0)

      )

      .join("")

      .slice(0, 2)

      .toUpperCase() ||

    "S";

  return (

    <>

      <Head>

        <title>

          {activeChat

            ? `${activeChat} | CollegeGPT`

            : "CollegeGPT | Your Campus AI"}

        </title>

        <meta

          name="description"

          content="CollegeGPT — your intelligent campus AI workspace."

        />

      </Head>

      <main

        className={

          styles.page

        }

      >

        <input

          ref={fileInputRef}

          type="file"

          accept="application/pdf"

          style={{ display: "none" }}

          onChange={(event) => {

            const file =

              event.target.files?.[0];

            uploadDocument(file);

          }}

        />

        <div

          className={

            styles.background

          }

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

          <div

            className={styles.grid}

          />

        </div>

        {mobileSidebarOpen && (

          <button

            type="button"

            className={

              styles.mobileBackdrop

            }

            aria-label="Close menu"

            onClick={() =>

              setMobileSidebarOpen(

                false

              )

            }

          />

        )}

        <aside

          className={`${styles.sidebar} ${

            sidebarOpen

              ? styles.sidebarOpen

              : styles.sidebarClosed

          } ${

            mobileSidebarOpen

              ? styles.mobileSidebarVisible

              : ""

          }`}

        >

          <div

            className={

              styles.sidebarTop

            }

          >

            <div

              className={

                styles.brand

              }

            >

              <div

                className={

                  styles.brandIcon

                }

              >

                ✦

              </div>

              {sidebarOpen && (

                <span>

                  CollegeGPT

                </span>

              )}

            </div>

            <button

              type="button"

              className={

                styles.collapseButton

              }

              onClick={() =>

                setSidebarOpen(

                  (value) =>

                    !value

                )

              }

              aria-label="Toggle sidebar"

            >

              {sidebarOpen

                ? "‹"

                : "›"}

            </button>

          </div>

          <button

            type="button"

            className={

              styles.newChat

            }

            onClick={

              startNewChat

            }

            disabled={

              loading ||

              regenerating ||

              uploadingDocument

            }

          >

            <span

              className={

                styles.newChatIcon

              }

            >

              +

            </span>

            {sidebarOpen && (

              <span>

                New chat

              </span>

            )}

          </button>

          <button

            type="button"

            className={

              styles.newChat

            }

            onClick={() =>

              fileInputRef.current?.click()

            }

            disabled={

              uploadingDocument ||

              loading ||

              regenerating

            }

          >

            <span

              className={

                styles.newChatIcon

              }

            >

              {uploadingDocument

                ? "…"

                : "📎"}

            </span>

            {sidebarOpen && (

              <span>

                {uploadingDocument

                  ? "Uploading..."

                  : "Upload PDF"}

              </span>

            )}

          </button>

          {uploadedDocuments.length > 0 &&

            sidebarOpen && (

              <div

                className={

                  styles.sidebarSection

                }

              >

                <p

                  className={

                    styles.sectionLabel

                  }

                >

                  DOCUMENTS

                </p>

                <div

                  className={

                    styles.conversationList

                  }

                >

                  {uploadedDocuments.map(

                    (document, index) => (

                      <div

                        key={

                          document._id ||

                          document.id ||

                          `${document.filename || "document"}-${index}`

                        }

                        className={

                          styles.chatItemWrapper

                        }

                        style={{

                          display: "flex",

                          alignItems: "center",

                          gap: "4px",

                        }}

                      >

                        <button

                          type="button"

                          className={

                            styles.chatItem

                          }

                          onClick={() =>

                            openDocument(document)

                          }

                          title="Open PDF"

                          style={{

                            flex: "1",

                            minWidth: 0,

                            cursor: "pointer",

                            border: "0",

                            textAlign: "left",

                          }}

                          disabled={

                            deletingDocumentId ===

                            (document._id || document.id)

                          }

                        >

                          <span

                            className={

                              styles.chatItemDot

                            }

                          >

                            📄

                          </span>

                          <span

                            className={

                              styles.chatItemTitle

                            }

                          >

                            {document.originalName ||

                              document.filename ||

                              document.name ||

                              "Uploaded PDF"}

                          </span>

                        </button>

                        <button

                          type="button"

                          className={

                            styles.chatActionButton

                          }

                          onClick={() =>

                            deleteDocument(document)

                          }

                          title="Delete PDF"

                          aria-label={`Delete ${document.originalName || "PDF"}`}

                          disabled={

                            deletingDocumentId ===

                            (document._id || document.id)

                          }

                          style={{

                            flexShrink: 0,

                            color: "#ff6b78",

                            fontWeight: "700",

                            minWidth: "30px",

                          }}

                        >

                          {deletingDocumentId ===

                          (document._id || document.id)

                            ? "…"

                            : "×"}

                        </button>

                      </div>

                    )

                  )}

                </div>

              </div>

            )}

          {sidebarOpen && (

            <>

              <div

                className={

                  styles.searchBox

                }

              >

                <span>

                  ⌕

                </span>

                <input

                  value={

                    searchTerm

                  }

                  onChange={(

                    event

                  ) =>

                    setSearchTerm(

                      event.target

                        .value

                    )

                  }

                  placeholder="Search chats"

                  aria-label="Search chats"

                />

                {searchTerm && (

                  <button

                    type="button"

                    onClick={() =>

                      setSearchTerm(

                        ""

                      )

                    }

                    aria-label="Clear search"

                  >

                    ×

                  </button>

                )}

              </div>

              <div

                className={

                  styles.sidebarSection

                }

              >

                <p

                  className={

                    styles.sectionLabel

                  }

                >

                  CONVERSATIONS

                </p>

                {loadingConversations ? (

                  <div

                    className={

                      styles.sidebarEmpty

                    }

                  >

                    <span

                      className={

                        styles.miniSpinner

                      }

                    />

                    Loading...

                  </div>

                ) : filteredConversations.length ===

                  0 ? (

                  <div

                    className={

                      styles.sidebarEmpty

                    }

                  >

                    <span>

                      •

                    </span>

                    <span>

                      {searchTerm

                        ? "No matching chats"

                        : "Start your first chat"}

                    </span>

                  </div>

                ) : (

                  <div

                    className={

                      styles.conversationList

                    }

                  >

                    {filteredConversations.map(

                      (

                        conversation

                      ) => (

                        <div

                          key={

                            conversation._id

                          }

                          className={`${styles.chatItemWrapper} ${

                            conversationId ===

                            conversation._id

                              ? styles.activeChatItemWrapper

                              : ""

                          }`}

                        >

                          <button

                            type="button"

                            className={`${styles.chatItem} ${

                              conversationId ===

                              conversation._id

                                ? styles.activeChatItem

                                : ""

                            }`}

                            onClick={() =>

                              openConversation(

                                conversation

                              )

                            }

                          >

                            <span

                              className={

                                styles.chatItemDot

                              }

                            >

                              ●

                            </span>

                            <span

                              className={

                                styles.chatItemTitle

                              }

                            >

                              {

                                conversation.title

                              }

                            </span>

                          </button>

                          <div

                            className={

                              styles.chatActions

                            }

                          >

                            <button

                              type="button"

                              className={

                                styles.chatActionButton

                              }

                              onClick={() =>

                                renameConversation(

                                  conversation

                                )

                              }

                              title="Rename"

                              aria-label={`Rename ${conversation.title}`}

                              disabled={

                                loading ||

                                regenerating

                              }

                            >

                              ✎

                            </button>

                            <button

                              type="button"

                              className={

                                styles.chatActionButton

                              }

                              onClick={() =>

                                deleteConversation(

                                  conversation

                                )

                              }

                              title="Delete"

                              aria-label={`Delete ${conversation.title}`}

                              disabled={

                                loading ||

                                regenerating

                              }

                            >

                              ×

                            </button>

                          </div>

                        </div>

                      )

                    )}

                  </div>

                )}

              </div>

            </>

          )}

          <div

            className={

              styles.sidebarBottom

            }

          >

            <button

              type="button"

              className={

                styles.sidebarAction

              }

              onClick={() =>

                setSettingsOpen(

                  true

                )

              }

            >

              <span>

                ⚙

              </span>

              {sidebarOpen && (

                <span>

                  Settings

                </span>

              )}

            </button>

            <button

              type="button"

              className={`${styles.sidebarAction} ${styles.logout}`}

              onClick={

                handleLogout

              }

            >

              <span>

                ↪

              </span>

              {sidebarOpen && (

                <span>

                  Log out

                </span>

              )}

            </button>

          </div>

        </aside>

        <section

          className={

            styles.workspace

          }

        >

          <header

            className={

              styles.topbar

            }

          >

            <div

              className={

                styles.mobileTopbarLeft

              }

            >

              <button

                type="button"

                className={

                  styles.mobileMenuButton

                }

                onClick={() =>

                  setMobileSidebarOpen(

                    true

                  )

                }

                aria-label="Open menu"

              >

                ☰

              </button>

              <div

                className={

                  styles.mobileBrand

                }

              >

                <div

                  className={

                    styles.brandIcon

                  }

                >

                  ✦

                </div>

                <span>

                  CollegeGPT

                </span>

              </div>

            </div>

            <div

              className={

                styles.topbarRight

              }

            >

              <div

                className={

                  styles.aiStatus

                }

              >

                <span />

                AI online

              </div>

              <button

                type="button"

                className={

                  styles.profileButton

                }

                onClick={() =>

                  setSettingsOpen(

                    true

                  )

                }

                aria-label="Open account settings"

              >

                <div

                  className={

                    styles.avatar

                  }

                >

                  {initials}

                </div>

                <div

                  className={

                    styles.userInfo

                  }

                >

                  <strong>

                    {firstName}

                  </strong>

                  <span>

                    Student

                  </span>

                </div>

              </button>

            </div>

          </header>

          <div

            className={

              styles.content

            }

          >

            {loadingConversation ? (

              <div

                className={

                  styles.loadingScreen

                }

              >

                <div

                  className={

                    styles.loadingOrb

                  }

                >

                  ✦

                </div>

                <p>

                  Opening your conversation...

                </p>

              </div>

            ) : !activeChat ? (

              <div

                className={

                  styles.welcomeArea

                }

              >

                <div

                  className={

                    styles.welcomeBadge

                  }

                >

                  <span

                    className={

                      styles.statusDot

                    }

                  />

                  CAMPUS AI ONLINE

                </div>

                <h1

                  className={

                    styles.welcomeTitle

                  }

                >

                  What are you

                  working on,

                  <span>

                    {firstName}?

                  </span>

                </h1>

                <p

                  className={

                    styles.welcomeSubtitle

                  }

                >

                  Ask questions, learn

                  faster, prepare for

                  exams, or get help

                  with your campus

                  journey.

                </p>

                <div

                  className={

                    styles.suggestions

                  }

                >

                  <button

                    type="button"

                    className={

                      styles.suggestionCard

                    }

                    onClick={() =>

                      handleSuggestion(

                        "Help me prepare for my upcoming exams"

                      )

                    }

                  >

                    <span

                      className={

                        styles.suggestionIcon

                      }

                    >

                      ◈

                    </span>

                    <span>

                      <strong>

                        Exam prep

                      </strong>

                      <small>

                        Build a focused

                        study plan

                      </small>

                    </span>

                    <span

                      className={

                        styles.cardArrow

                      }

                    >

                      ↗

                    </span>

                  </button>

                  <button

                    type="button"

                    className={

                      styles.suggestionCard

                    }

                    onClick={() =>

                      handleSuggestion(

                        "Explain a difficult technical concept in simple terms"

                      )

                    }

                  >

                    <span

                      className={

                        styles.suggestionIcon

                      }

                    >

                      ◎

                    </span>

                    <span>

                      <strong>

                        Learn something

                      </strong>

                      <small>

                        Make difficult

                        topics simple

                      </small>

                    </span>

                    <span

                      className={

                        styles.cardArrow

                      }

                    >

                      ↗

                    </span>

                  </button>

                  <button

                    type="button"

                    className={

                      styles.suggestionCard

                    }

                    onClick={() =>

                      handleSuggestion(

                        "Help me understand and complete my assignment"

                      )

                    }

                  >

                    <span

                      className={

                        styles.suggestionIcon

                      }

                    >

                      ◫

                    </span>

                    <span>

                      <strong>

                        Assignment help

                      </strong>

                      <small>

                        Understand it,

                        don't just copy it

                      </small>

                    </span>

                    <span

                      className={

                        styles.cardArrow

                      }

                    >

                      ↗

                    </span>

                  </button>

                  <button

                    type="button"

                    className={

                      styles.suggestionCard

                    }

                    onClick={() =>

                      handleSuggestion(

                        "Give me a roadmap to prepare for a software engineering interview"

                      )

                    }

                  >

                    <span

                      className={

                        styles.suggestionIcon

                      }

                    >

                      ⌁

                    </span>

                    <span>

                      <strong>

                        Career roadmap

                      </strong>

                      <small>

                        Plan your next

                        learning steps

                      </small>

                    </span>

                    <span

                      className={

                        styles.cardArrow

                      }

                    >

                      ↗

                    </span>

                  </button>

                </div>

                <form

                  className={

                    styles.chatForm

                  }

                  onSubmit={

                    sendMessage

                  }

                >

                  <div

                    className={

                      styles.chatInputWrapper

                    }

                  >

                    <textarea

                      ref={

                        textareaRef

                      }

                      value={

                        message

                      }

                      onChange={(

                        event

                      ) =>

                        setMessage(

                          event.target

                            .value

                        )

                      }

                      placeholder="Message CollegeGPT..."

                      rows={1}

                      disabled={

                        loading ||

                        regenerating ||

                        uploadingDocument

                      }

                      onKeyDown={(

                        event

                      ) => {

                        if (

                          event.key ===

                            "Enter" &&

                          !event.shiftKey

                        ) {

                          event.preventDefault();

                          sendMessage(

                            event

                          );

                        }

                      }}

                    />

                    <button

                      type={

                        loading

                          ? "button"

                          : "submit"

                      }

                      className={

                        styles.sendButton

                      }

                      disabled={

                        regenerating ||

                        uploadingDocument ||

                        (!loading &&

                          !message.trim())

                      }

                      onClick={

                        loading

                          ? stopGenerating

                          : undefined

                      }

                      aria-label={

                        loading

                          ? "Stop generating"

                          : "Send message"

                      }

                    >

                      {loading

                        ? "■"

                        : "↑"}

                    </button>

                  </div>

                  <div

                    className={

                      styles.inputHint

                    }

                  >

                    <span>

                      AI can make

                      mistakes. Verify

                      important

                      information.

                    </span>

                    <span>

                      Enter ↵ &nbsp;

                      Shift + Enter

                      for new line

                    </span>

                  </div>

                </form>

              </div>

            ) : (

              <div

                className={

                  styles.chatArea

                }

              >

                <div

                  className={

                    styles.chatHeader

                  }

                >

                  <button

                    type="button"

                    className={

                      styles.backButton

                    }

                    onClick={

                      startNewChat

                    }

                    aria-label="Start a new chat"

                  >

                    ←

                  </button>

                  <div

                    className={

                      styles.chatHeaderInfo

                    }

                  >

                    <span>

                      CONVERSATION

                    </span>

                    <h2>

                      {activeChat}

                    </h2>

                  </div>

                  <button

                    type="button"

                    className={

                      styles.headerNewChat

                    }

                    onClick={

                      startNewChat

                    }

                    disabled={

                      loading ||

                      regenerating

                    }

                  >

                    + New chat

                  </button>

                </div>

                <div

                  className={

                    styles.messageList

                  }

                >

                  {messages.map(

                    (

                      item,

                      index

                    ) => {

                      const isUser =

                        item.role ===

                        "user";

                      const isStreaming =

                        item.streaming ===

                        true;

                      const isLastAIMessage =

                        !isUser &&

                        !item.error &&

                        !isStreaming &&

                        index ===

                          messages.length -

                            1;

                      return (

                        <div

                          key={`${conversationId || "new"}-${index}`}

                          className={`${styles.messageRow} ${

                            isUser

                              ? styles.userMessageRow

                              : styles.aiMessageRow

                          }`}

                        >

                          {!isUser && (

                            <div

                              className={

                                styles.messageAvatar

                              }

                            >

                              ✦

                            </div>

                          )}

                          <div

                            className={`${styles.messageBubble} ${

                              isUser

                                ? styles.userBubble

                                : styles.aiBubble

                            } ${

                              item.error

                                ? styles.errorBubble

                                : ""

                            }`}

                          >

                            <div

                              className={

                                styles.messageTopLine

                              }

                            >

                              <div

                                className={

                                  styles.messageRole

                                }

                              >

                                {isUser

                                  ? "YOU"

                                  : "COLLEGEGPT"}

                              </div>

                              {!item.error && (

                                <div

                                  style={{

                                    display:

                                      "flex",

                                    alignItems:

                                      "center",

                                    gap:

                                      "10px",

                                  }}

                                >

                                  {!isUser && (

                                    <button

                                      type="button"

                                      className={

                                        styles.copyButton

                                      }

                                      onClick={() =>

                                        copyMessage(

                                          item.content ||

                                            "",

                                          index

                                        )

                                      }

                                      disabled={

                                        loading ||

                                        regenerating ||

                                        isStreaming

                                      }

                                    >

                                      {copiedIndex ===

                                      index

                                        ? "Copied"

                                        : "Copy"}

                                    </button>

                                  )}

                                  {isUser && (

                                    <button

                                      type="button"

                                      className={

                                        styles.copyButton

                                      }

                                      onClick={() =>

                                        startEditingMessage(

                                          index

                                        )

                                      }

                                      disabled={

                                        loading ||

                                        regenerating

                                      }

                                    >

                                      Edit

                                    </button>

                                  )}

                                  {isLastAIMessage && (

                                    <button

                                      type="button"

                                      className={

                                        styles.copyButton

                                      }

                                      onClick={

                                        regenerateResponse

                                      }

                                      disabled={

                                        loading ||

                                        regenerating

                                      }

                                    >

                                      {regenerating

                                        ? "Regenerating..."

                                        : "Regenerate"}

                                    </button>

                                  )}

                                </div>

                              )}

                            </div>

                            <div

                              className={

                                styles.messageContent

                              }

                            >

                              {isUser ? (

                                item.content

                              ) : (

                                <>

                                  {item.content ? (

                                    <ReactMarkdown

                                      remarkPlugins={[

                                        remarkGfm,

                                      ]}

                                    >

                                      {

                                        item.content

                                      }

                                    </ReactMarkdown>

                                  ) : (

                                    <div

                                      className={

                                        styles.thinkingContent

                                      }

                                    >

                                      <span>

                                        Thinking

                                      </span>

                                      <div

                                        className={

                                          styles.typingIndicator

                                        }

                                      >

                                        <span />

                                        <span />

                                        <span />

                                      </div>

                                    </div>

                                  )}

                                  {isStreaming &&

                                    item.content && (

                                      <span

                                        style={{

                                          display:

                                            "inline-block",

                                          width:

                                            "7px",

                                          height:

                                            "16px",

                                          marginLeft:

                                            "3px",

                                          borderRadius:

                                            "2px",

                                          background:

                                            "rgba(169,141,255,0.8)",

                                          verticalAlign:

                                            "middle",

                                          animation:

                                            "collegegptBlink 0.9s ease-in-out infinite",

                                        }}

                                      />

                                    )}

                                </>

                              )}

                            </div>

                          </div>

                        </div>

                      );

                    }

                  )}

                  {regenerating && (

                    <div

                      className={`${styles.messageRow} ${styles.aiMessageRow}`}

                    >

                      <div

                        className={

                          styles.messageAvatar

                        }

                      >

                        ✦

                      </div>

                      <div

                        className={`${styles.messageBubble} ${styles.aiBubble}`}

                      >

                        <div

                          className={

                            styles.messageRole

                          }

                        >

                          COLLEGEGPT

                        </div>

                        <div

                          className={

                            styles.thinkingContent

                          }

                        >

                          <span>

                            Regenerating

                          </span>

                          <div

                            className={

                              styles.typingIndicator

                            }

                          >

                            <span />

                            <span />

                            <span />

                          </div>

                        </div>

                      </div>

                    </div>

                  )}

                  <div

                    ref={

                      messagesEndRef

                    }

                  />

                </div>

                {editingIndex !==

                  null && (

                  <div

                    style={{

                      display:

                        "flex",

                      alignItems:

                        "center",

                      justifyContent:

                        "space-between",

                      marginBottom:

                        "8px",

                      padding:

                        "8px 12px",

                      border:

                        "1px solid rgba(126, 94, 255, 0.2)",

                      borderRadius:

                        "10px",

                      background:

                        "rgba(126, 94, 255, 0.07)",

                      color:

                        "rgba(255,255,255,0.65)",

                      fontSize:

                        "11px",

                    }}

                  >

                    <span>

                      Editing your

                      message

                    </span>

                    <button

                      type="button"

                      onClick={

                        cancelEditing

                      }

                      style={{

                        border:

                          "0",

                        background:

                          "transparent",

                        color:

                          "#a98dff",

                        cursor:

                          "pointer",

                        fontSize:

                          "11px",

                      }}

                    >

                      Cancel

                    </button>

                  </div>

                )}

                <form

                  className={

                    styles.chatFormBottom

                  }

                  onSubmit={

                    sendMessage

                  }

                >

                  <div

                    className={

                      styles.chatInputWrapper

                    }

                  >

                    <textarea

                      ref={

                        textareaRef

                      }

                      value={

                        message

                      }

                      onChange={(

                        event

                      ) =>

                        setMessage(

                          event.target

                            .value

                        )

                      }

                      placeholder={

                        editingIndex !==

                        null

                          ? "Edit your message..."

                          : "Message CollegeGPT..."

                      }

                      rows={1}

                      disabled={

                        loading ||

                        regenerating ||

                        uploadingDocument

                      }

                      onKeyDown={(

                        event

                      ) => {

                        if (

                          event.key ===

                            "Enter" &&

                          !event.shiftKey

                        ) {

                          event.preventDefault();

                          sendMessage(

                            event

                          );

                        }

                      }}

                    />

                    <button

                      type={

                        loading

                          ? "button"

                          : "submit"

                      }

                      className={

                        styles.sendButton

                      }

                      disabled={

                        regenerating ||

                        uploadingDocument ||

                        (!loading &&

                          !message.trim())

                      }

                      onClick={

                        loading

                          ? stopGenerating

                          : undefined

                      }

                      aria-label={

                        loading

                          ? "Stop generating"

                          : "Send message"

                      }

                    >

                      {loading ? "■" : "↑"}

                    </button>

                  </div>

                  <div

                    className={

                      styles.inputHint

                    }

                  >

                    <span>

                      Your conversations

                      are saved to

                      your account.

                    </span>

                    <span>

                      Enter ↵

                    </span>

                  </div>

                </form>

              </div>

            )}

          </div>

          <footer

            className={

              styles.footer

            }

          >

            <span>

              <strong>

                CollegeGPT

              </strong>{" "}

              · Campus AI

              workspace

            </span>

            <span>

              Built for students

            </span>

          </footer>

        </section>

        {settingsOpen && (

          <div

            className={

              styles.modalOverlay

            }

            onClick={() =>

              setSettingsOpen(

                false

              )

            }

          >

            <div

              className={

                styles.settingsModal

              }

              onClick={(event) =>

                event.stopPropagation()

              }

            >

              <div

                className={

                  styles.settingsHeader

                }

              >

                <div>

                  <span

                    className={

                      styles.settingsEyebrow

                    }

                  >

                    ACCOUNT

                  </span>

                  <h2>

                    Settings

                  </h2>

                  <p>

                    Manage your

                    CollegeGPT

                    account.

                  </p>

                </div>

                <button

                  type="button"

                  className={

                    styles.closeButton

                  }

                  onClick={() =>

                    setSettingsOpen(

                      false

                    )

                  }

                  aria-label="Close settings"

                >

                  ×

                </button>

              </div>

              <div

                className={

                  styles.profileCard

                }

              >

                <div

                  className={

                    styles.settingsAvatar

                  }

                >

                  {initials}

                </div>

                <div>

                  <strong>

                    {user.name ||

                      firstName}

                  </strong>

                  <span>

                    {user.email ||

                      ""}

                  </span>

                </div>

              </div>

              <div

                className={

                  styles.settingsSection

                }

              >

                <div

                  className={

                    styles.settingsRow

                  }

                >

                  <div>

                    <strong>

                      Account

                    </strong>

                    <span>

                      Your CollegeGPT

                      student account

                    </span>

                  </div>

                  <span

                    className={

                      styles.settingsStatus

                    }

                  >

                    Active

                  </span>

                </div>

                <div

                  className={

                    styles.settingsRow

                  }

                >

                  <div>

                    <strong>

                      AI Assistant

                    </strong>

                    <span>

                      CollegeGPT AI is

                      connected

                    </span>

                  </div>

                  <span

                    className={

                      styles.settingsStatus

                    }

                  >

                    Online

                  </span>

                </div>

                <div

                  className={

                    styles.settingsRow

                  }

                >

                  <div>

                    <strong>

                      Conversation

                      memory

                    </strong>

                    <span>

                      Your chats are

                      stored in MongoDB

                    </span>

                  </div>

                  <span

                    className={

                      styles.settingsStatus

                    }

                  >

                    Enabled

                  </span>

                </div>

              </div>

              <button

                type="button"

                className={

                  styles.settingsLogout

                }

                onClick={

                  handleLogout

                }

              >

                Log out of CollegeGPT

              </button>

            </div>

          </div>

        )}

        {documentModalOpen &&

          selectedDocument && (

            <div

              className={

                styles.modalOverlay

              }

              onClick={

                closeDocumentModal

              }

            >

              <div

                className={

                  styles.settingsModal

                }

                style={{

                  width:

                    "min(520px, 100%)",

                }}

                onClick={(event) =>

                  event.stopPropagation()

                }

              >

                <div

                  className={

                    styles.settingsHeader

                  }

                >

                  <div>

                    <span

                      className={

                        styles.settingsEyebrow

                      }

                    >

                      DOCUMENT

                    </span>

                    <h2>

                      Uploaded PDF

                    </h2>

                    <p>

                      This document is available in your current CollegeGPT workspace.

                    </p>

                  </div>

                  <button

                    type="button"

                    className={

                      styles.closeButton

                    }

                    onClick={

                      closeDocumentModal

                    }

                    aria-label="Close document"

                  >

                    ×

                  </button>

                </div>

                <div

                  className={

                    styles.profileCard

                  }

                  style={{

                    marginBottom: "16px",

                  }}

                >

                  <div

                    className={

                      styles.settingsAvatar

                    }

                  >

                    📄

                  </div>

                  <div

                    style={{

                      minWidth: 0,

                    }}

                  >

                    <strong

                      style={{

                        display: "block",

                        overflowWrap: "anywhere",

                      }}

                    >

                      {selectedDocument.originalName ||

                        selectedDocument.filename ||

                        selectedDocument.name ||

                        "Uploaded PDF"}

                    </strong>

                    <span>

                      {formatDocumentSize(

                        selectedDocument.size ||

                          selectedDocument.fileSize

                      )}

                    </span>

                  </div>

                </div>

                <div

                  className={

                    styles.settingsSection

                  }

                >

                  <div

                    className={

                      styles.settingsRow

                    }

                  >

                    <div>

                      <strong>

                        Processing status

                      </strong>

                      <span>

                        PDF uploaded successfully

                      </span>

                    </div>

                    <span

                      className={

                        styles.settingsStatus

                      }

                    >

                      Ready

                    </span>

                  </div>

                  <div

                    className={

                      styles.settingsRow

                    }

                  >

                    <div>

                      <strong>

                        Document ID

                      </strong>

                      <span

                        style={{

                          overflowWrap: "anywhere",

                        }}

                      >

                        {selectedDocument._id ||

                          selectedDocument.id ||

                          "Not returned"}

                      </span>

                    </div>

                  </div>

                  {selectedDocument.createdAt && (

                    <div

                      className={

                        styles.settingsRow

                      }

                    >

                      <div>

                        <strong>

                          Uploaded

                        </strong>

                        <span>

                          {new Date(

                            selectedDocument.createdAt

                          ).toLocaleString()}

                        </span>

                      </div>

                    </div>

                  )}

                </div>

                <button

                  type="button"

                  className={

                    styles.settingsLogout

                  }

                  onClick={

                    closeDocumentModal

                  }

                  style={{

                    marginTop: "18px",

                    color: "#ffffff",

                    background:

                      "linear-gradient(135deg, #6751ed, #9655ed)",

                  }}

                >

                  Close document

                </button>

              </div>

            </div>

          )}

        {renameModalOpen &&

          selectedConversation && (

            <div

              className={

                styles.modalOverlay

              }

              onClick={

                closeRenameModal

              }

            >

              <div

                className={

                  styles.settingsModal

                }

                style={{

                  width:

                    "min(440px, 100%)",

                }}

                onClick={(event) =>

                  event.stopPropagation()

                }

              >

                <div

                  className={

                    styles.settingsHeader

                  }

                >

                  <div>

                    <span

                      className={

                        styles.settingsEyebrow

                      }

                    >

                      CONVERSATION

                    </span>

                    <h2>

                      Rename chat

                    </h2>

                    <p>

                      Choose a new

                      name for this

                      conversation.

                    </p>

                  </div>

                  <button

                    type="button"

                    className={

                      styles.closeButton

                    }

                    onClick={

                      closeRenameModal

                    }

                    aria-label="Close rename dialog"

                  >

                    ×

                  </button>

                </div>

                <input

                  autoFocus

                  value={

                    renameTitle

                  }

                  onChange={(event) =>

                    setRenameTitle(

                      event.target.value

                    )

                  }

                  onKeyDown={(event) => {

                    if (

                      event.key ===

                      "Enter"

                    ) {

                      event.preventDefault();

                      saveRenamedConversation();

                    }

                    if (

                      event.key ===

                      "Escape"

                    ) {

                      closeRenameModal();

                    }

                  }}

                  maxLength={100}

                  style={{

                    width:

                      "100%",

                    boxSizing:

                      "border-box",

                    padding:

                      "13px 14px",

                    border:

                      "1px solid rgba(255,255,255,0.1)",

                    borderRadius:

                      "12px",

                    outline:

                      "none",

                    background:

                      "rgba(255,255,255,0.05)",

                    color:

                      "#ffffff",

                    fontSize:

                      "14px",

                  }}

                />

                <div

                  style={{

                    display:

                      "flex",

                    justifyContent:

                      "flex-end",

                    gap: "10px",

                    marginTop:

                      "18px",

                  }}

                >

                  <button

                    type="button"

                    onClick={

                      closeRenameModal

                    }

                    style={{

                      border:

                        "1px solid rgba(255,255,255,0.08)",

                      background:

                        "rgba(255,255,255,0.05)",

                      color:

                        "rgba(255,255,255,0.7)",

                      borderRadius:

                        "10px",

                      padding:

                        "10px 16px",

                      cursor:

                        "pointer",

                      fontSize:

                        "12px",

                      fontWeight:

                        "600",

                    }}

                  >

                    Cancel

                  </button>

                  <button

                    type="button"

                    onClick={

                      saveRenamedConversation

                    }

                    disabled={

                      !renameTitle.trim()

                    }

                    style={{

                      border:

                        "0",

                      background:

                        "linear-gradient(135deg, #6751ed, #9655ed)",

                      color:

                        "#ffffff",

                      borderRadius:

                        "10px",

                      padding:

                        "10px 18px",

                      cursor:

                        renameTitle.trim()

                          ? "pointer"

                          : "not-allowed",

                      opacity:

                        renameTitle.trim()

                          ? 1

                          : 0.45,

                      fontSize:

                        "12px",

                      fontWeight:

                        "700",

                    }}

                  >

                    Save changes

                  </button>

                </div>

              </div>

            </div>

          )}

        {deleteModalOpen &&

          selectedConversation && (

            <div

              className={

                styles.modalOverlay

              }

              onClick={

                closeDeleteModal

              }

            >

              <div

                className={

                  styles.settingsModal

                }

                style={{

                  width:

                    "min(440px, 100%)",

                }}

                onClick={(event) =>

                  event.stopPropagation()

                }

              >

                <div

                  style={{

                    display:

                      "flex",

                    alignItems:

                      "flex-start",

                    gap: "15px",

                  }}

                >

                  <div

                    style={{

                      width:

                        "46px",

                      height:

                        "46px",

                      flexShrink:

                        0,

                      borderRadius:

                        "13px",

                      display:

                        "grid",

                      placeItems:

                        "center",

                      background:

                        "rgba(255,70,90,0.12)",

                      color:

                        "#ff7b88",

                      fontSize:

                        "20px",

                    }}

                  >

                    ×

                  </div>

                  <div>

                    <span

                      className={

                        styles.settingsEyebrow

                      }

                    >

                      DELETE

                    </span>

                    <h2

                      style={{

                        margin:

                          "4px 0 8px",

                        fontSize:

                          "24px",

                      }}

                    >

                      Delete conversation?

                    </h2>

                    <p

                      style={{

                        margin:

                          "0",

                        color:

                          "rgba(255,255,255,0.58)",

                        fontSize:

                          "13px",

                        lineHeight:

                          "1.6",

                      }}

                    >

                      Are you sure you

                      want to delete{" "}

                      <strong

                        style={{

                          color:

                            "#ffffff",

                        }}

                      >

                        "

                        {

                          selectedConversation.title

                        }

                        "

                      </strong>

                      ?

                    </p>

                    <p

                      style={{

                        margin:

                          "9px 0 0",

                        color:

                          "#ff7885",

                        fontSize:

                          "12px",

                      }}

                    >

                      This action cannot

                      be undone.

                    </p>

                  </div>

                </div>

                <div

                  style={{

                    display:

                      "flex",

                    justifyContent:

                      "flex-end",

                    gap: "10px",

                    marginTop:

                      "25px",

                  }}

                >

                  <button

                    type="button"

                    onClick={

                      closeDeleteModal

                    }

                    style={{

                      border:

                        "1px solid rgba(255,255,255,0.08)",

                      background:

                        "rgba(255,255,255,0.05)",

                      color:

                        "rgba(255,255,255,0.7)",

                      borderRadius:

                        "10px",

                      padding:

                        "10px 16px",

                      cursor:

                        "pointer",

                      fontSize:

                        "12px",

                      fontWeight:

                        "600",

                    }}

                  >

                    Cancel

                  </button>

                  <button

                    type="button"

                    onClick={

                      confirmDeleteConversation

                    }

                    style={{

                      border:

                        "0",

                      background:

                        "#c93f4d",

                      color:

                        "#ffffff",

                      borderRadius:

                        "10px",

                      padding:

                        "10px 18px",

                      cursor:

                        "pointer",

                      fontSize:

                        "12px",

                      fontWeight:

                        "700",

                    }}

                  >

                    Delete

                  </button>

                </div>

              </div>

            </div>

          )}

      </main>

      <style jsx global>{`

        @keyframes collegegptBlink {

          0%,

          100% {

            opacity: 0.25;

          }

          50% {

            opacity: 1;

          }

        }

      `}</style>

    </>

  );

}