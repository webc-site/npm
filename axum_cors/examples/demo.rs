use axum::{Router, middleware, response::IntoResponse, routing::get};
use axum_cors::cors;
use tokio::net::TcpListener;

async fn handler() -> impl IntoResponse {
  "Hello, CORS!"
}

#[tokio::main]
async fn main() -> aok::Result<()> {
  let app = Router::new()
    .route("/", get(handler))
    .layer(middleware::from_fn(cors));

  let listener = TcpListener::bind("127.0.0.1:3000").await?;
  println!("Server running on http://127.0.0.1:3000");

  axum::serve(listener, app).await?;

  Ok(())
}
