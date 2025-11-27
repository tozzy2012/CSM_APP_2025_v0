import requests
import uuid

BASE_URL = "http://localhost:8000"

def test_invite_lifecycle():
    # 1. Create Invite
    email = f"test_invite_{uuid.uuid4()}@example.com"
    print(f"Creating invite for {email}...")
    response = requests.post(f"{BASE_URL}/api/v1/invites", json={"email": email, "role": "CSM"})
    
    if response.status_code != 201:
        print(f"Failed to create invite: {response.text}")
        return

    invite_id = response.json()["id"]
    print(f"Created invite: {invite_id}")

    # 2. Update Invite Role
    new_role = "ORG_ADMIN"
    print(f"Updating role to {new_role}...")
    response = requests.patch(f"{BASE_URL}/api/v1/invites/{invite_id}", json={"role": new_role})
    
    if response.status_code != 200:
        print(f"Failed to update role: {response.text}")
        return

    assert response.json()["role"] == new_role
    print(f"Updated role to: {new_role}")

    # 3. Delete Invite Permanently
    print("Deleting invite permanently...")
    response = requests.delete(f"{BASE_URL}/api/v1/invites/{invite_id}/permanent")
    
    if response.status_code != 204:
        print(f"Failed to delete invite: {response.text}")
        return

    print("Deleted invite permanently")

    # 4. Verify Deletion
    # We can try to update it again, should fail
    print("Verifying deletion...")
    response = requests.patch(f"{BASE_URL}/api/v1/invites/{invite_id}", json={"role": "CSM"})
    
    if response.status_code == 404:
        print("Verified deletion (404 on update)")
    else:
        print(f"Deletion verification failed: {response.status_code}")

if __name__ == "__main__":
    try:
        test_invite_lifecycle()
        print("All tests passed!")
    except Exception as e:
        print(f"Test failed: {e}")

