const API_BASE = import.meta.env.VITE_API_BASE || "/api";
let csrfToken = "";

export class ApiError extends Error {
  constructor(code, message, status) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

export function setCsrfToken(token) {
  csrfToken = token || "";
}

function requestHeaders(method, headers = {}) {
  const result = new Headers(headers);
  if (method !== "GET" && csrfToken) result.set("X-CSRF-Token", csrfToken);
  return result;
}

async function handleResponse(response) {
  const payload = await response.json().catch(() => null);
  if (payload?.error) {
    throw new ApiError(payload.error.code, payload.error.message, response.status);
  }
  if (!response.ok) {
    throw new ApiError("http_error", response.statusText || "Request failed", response.status);
  }
  return payload && Object.hasOwn(payload, "data") ? payload.data : payload;
}

async function request(method, path, body, headers) {
  const requestHeadersValue = requestHeaders(method, headers);
  const options = { method, credentials: "include", headers: requestHeadersValue };
  if (body !== undefined) {
    requestHeadersValue.set("Content-Type", "application/json");
    options.body = JSON.stringify(body);
  }
  const response = await fetch(`${API_BASE}${path}`, options);
  return handleResponse(response);
}

export const apiGet = (path, options = {}) => request("GET", path, undefined, options.headers);
export const apiPost = (path, body, options = {}) => request("POST", path, body, options.headers);
export const apiPut = (path, body, options = {}) => request("PUT", path, body, options.headers);
export const apiDelete = (path, options = {}) => request("DELETE", path, undefined, options.headers);

export function apiUpload(path, formData, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE}${path}`);
    xhr.withCredentials = true;
    if (csrfToken) xhr.setRequestHeader("X-CSRF-Token", csrfToken);
    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });
    xhr.addEventListener("load", () => {
      let response;
      try {
        response = JSON.parse(xhr.responseText);
      } catch {
        reject(new ApiError("invalid_response", "The server returned an invalid response", xhr.status));
        return;
      }
      if (response?.error) {
        reject(new ApiError(response.error.code, response.error.message, xhr.status));
      } else if (xhr.status < 200 || xhr.status >= 300) {
        reject(new ApiError("http_error", xhr.statusText || "Upload failed", xhr.status));
      } else {
        resolve(response && Object.hasOwn(response, "data") ? response.data : response);
      }
    });
    xhr.addEventListener("error", () => reject(new ApiError("network_error", "Upload failed", xhr.status)));
    xhr.send(formData);
  });
}
