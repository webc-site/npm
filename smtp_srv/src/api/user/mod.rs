mod ls;
mod rm;
mod set;

use axum::{
  Router,
  routing::{delete, get, post},
};
pub use ls::{by_host, by_page};
pub use rm::rm;
pub use set::set;

pub fn router() -> Router {
  Router::new()
    .route("/", post(set))
    .route("/{host}", delete(rm).get(by_host))
    .route("/{host}/{page}", get(by_page))
}
