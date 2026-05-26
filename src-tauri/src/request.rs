use reqwest::header::{HeaderMap, HeaderValue, CONTENT_TYPE, COOKIE};
use reqwest::{Client, Proxy};
use serde::Serialize;
use std::collections::HashMap;
use tauri::command;

#[derive(Serialize)]
pub struct ResponseData {
    pub text: String,
    pub headers: HashMap<String, String>,
}

fn build_client(proxy_url: Option<&str>, headers: Option<HeaderMap>) -> Result<Client, String> {
    let mut builder = Client::builder();

    if let Some(proxy_url) = proxy_url.filter(|value| !value.trim().is_empty()) {
        let proxy = Proxy::all(proxy_url).map_err(|error| format!("Invalid proxy: {}", error))?;
        builder = builder.proxy(proxy);
    }

    if let Some(headers) = headers {
        builder = builder.default_headers(headers);
    }

    builder
        .build()
        .map_err(|error| format!("Failed to build HTTP client: {}", error))
}

pub async fn fetch_data(url: &str, proxy_url: Option<&str>) -> Result<String, String> {
    let client = build_client(proxy_url, None)?;
    let response = client
        .get(url)
        .send()
        .await
        .map_err(|error| format!("Failed to send request: {}", error))?;

    response
        .text()
        .await
        .map_err(|error| format!("Failed to read response body: {}", error))
}

#[command]
pub async fn fetch_data_buffer(
    url: &str,
    buffer: Vec<u8>,
    file_name: &str,
    proxy_url: Option<String>,
) -> Result<Vec<u8>, String> {
    let client = build_client(proxy_url.as_deref(), None)?;
    let boundary = "-*_r1999";

    let mut body = Vec::new();
    body.extend_from_slice(format!("--{}\r\n", boundary).as_bytes());
    body.extend_from_slice(
        format!(
            "Content-Disposition: form-data; name=\"data\"; filename=\"{}\"\r\n\r\n",
            file_name
        )
        .as_bytes(),
    );
    body.extend_from_slice(&buffer);
    body.extend_from_slice(format!("\r\n--{}--\r\n", boundary).as_bytes());

    let mut headers = HeaderMap::new();
    headers.insert("Host", HeaderValue::from_static("tiebac.baidu.com"));
    headers.insert("User-Agent", HeaderValue::from_static("neotieba"));
    headers.insert("x_bd_data_type", HeaderValue::from_static("protobuf"));
    headers.insert("Connection", HeaderValue::from_static("keep-alive"));
    headers.insert("Accept", HeaderValue::from_static("*/*"));
    headers.insert(
        CONTENT_TYPE,
        HeaderValue::from_str(&format!("multipart/form-data; boundary={}", boundary))
            .map_err(|error| format!("Invalid content type: {}", error))?,
    );

    let response = client
        .post(url)
        .headers(headers)
        .body(body)
        .send()
        .await
        .map_err(|error| format!("Failed to send protobuf request: {}", error))?;

    if !response.status().is_success() {
        return Err(format!("Request failed with status: {}", response.status()));
    }

    response
        .bytes()
        .await
        .map(|data| data.to_vec())
        .map_err(|error| format!("Failed to read response body: {}", error))
}

#[command]
pub async fn fetch_data_post(
    url: &str,
    body: String,
    proxy_url: Option<String>,
) -> Result<String, String> {
    let client = build_client(proxy_url.as_deref(), None)?;
    let response = client
        .post(url)
        .body(body)
        .send()
        .await
        .map_err(|error| format!("Failed to send post request: {}", error))?;

    response
        .text()
        .await
        .map_err(|error| format!("Failed to read response body: {}", error))
}

pub async fn fetch_data_with_headers(
    url: &str,
    headers: HeaderMap,
    proxy_url: Option<&str>,
) -> Result<ResponseData, String> {
    let client = build_client(proxy_url, None)?;
    let response = client
        .get(url)
        .headers(headers)
        .send()
        .await
        .map_err(|error| format!("Failed to send header request: {}", error))?;

    let headers = response
        .headers()
        .iter()
        .map(|(key, value)| (key.to_string(), value.to_str().unwrap_or("").to_string()))
        .collect();

    let text = response
        .text()
        .await
        .map_err(|error| format!("Failed to read response body: {}", error))?;

    Ok(ResponseData { text, headers })
}

#[command]
pub async fn fetch_data_with_cookie(
    url: &str,
    cookie: &str,
    proxy_url: Option<String>,
) -> Result<String, String> {
    let mut headers = HeaderMap::new();

    if !cookie.trim().is_empty() {
        headers.insert(
            COOKIE,
            HeaderValue::from_str(cookie).map_err(|error| format!("Invalid cookie: {}", error))?,
        );
    }

    let client = build_client(proxy_url.as_deref(), Some(headers))?;
    let response = client
        .get(url)
        .send()
        .await
        .map_err(|error| format!("Failed to send cookie request: {}", error))?;

    if !response.status().is_success() {
        return Err(format!("Request failed with status: {}", response.status()));
    }

    response
        .text()
        .await
        .map_err(|error| format!("Failed to read response body: {}", error))
}
