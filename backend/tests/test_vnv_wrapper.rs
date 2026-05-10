// Unit tests for VnvClient — only test URL construction and client creation
// since actual API calls would require network access.

use viernulvier_backend::worker::vnv_wrapper::VnvClient;

#[test]
fn test_vnv_client_creates_without_panic() {
    let _client = VnvClient::new("test-api-key".to_string());
}
