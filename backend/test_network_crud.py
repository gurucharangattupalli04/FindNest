import urllib.request
import json
import uuid

BASE = 'http://127.0.0.1:8000/api/v1'

def run_test():
    email = f"netuser_{uuid.uuid4().hex[:8]}@example.com"
    password = "StrongPassword99!"
    
    # 1. Register User
    reg_data = json.dumps({'email': email, 'full_name': 'Live Network Tester', 'password': password}).encode()
    req = urllib.request.Request(f'{BASE}/auth/register', data=reg_data, headers={'Content-Type': 'application/json'}, method='POST')
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 201
        print(f'[1/6] Registered test user: {email}')

    # 2. Login
    login_data = json.dumps({'email': email, 'password': password}).encode()
    req = urllib.request.Request(f'{BASE}/auth/login', data=login_data, headers={'Content-Type': 'application/json'}, method='POST')
    with urllib.request.urlopen(req) as resp:
        tokens = json.loads(resp.read().decode())
        token = tokens['access_token']
        print('[2/6] Login OK, acquired JWT.')

    # 3. Create Lost Item
    item_payload = json.dumps({
        'title': 'Network Bose QuietComfort Headphones',
        'category': 'electronics',
        'description': 'Left in study pod 3',
        'location': 'Central Library Pod 3',
        'date_lost': '2026-09-05T09:00:00Z',
        'reward': '$50 Reward',
        'contact_name': 'Live Network Tester'
    }).encode()
    req = urllib.request.Request(f'{BASE}/lost-items', data=item_payload, headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {token}'}, method='POST')
    with urllib.request.urlopen(req) as resp:
        created = json.loads(resp.read().decode())
        item_id = created['id']
        print(f'[3/6] Created lost item ID {item_id}: {created["title"]}')

    # 4. Create Found Item
    found_payload = json.dumps({
        'title': 'Keys on blue lanyard',
        'category': 'keys',
        'description': 'Set of 3 keys with blue strap',
        'location': 'Cafeteria Table 12',
        'storage_location': 'Campus Security Office',
        'date_found': '2026-09-05T10:00:00Z',
        'contact_name': 'Cafeteria Staff'
    }).encode()
    req = urllib.request.Request(f'{BASE}/found-items', data=found_payload, headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {token}'}, method='POST')
    with urllib.request.urlopen(req) as resp:
        found_created = json.loads(resp.read().decode())
        found_id = found_created['id']
        print(f'[4/6] Created found item ID {found_id}: {found_created["title"]}')

    # 5. Update Lost Item
    update_payload = json.dumps({'title': 'Network Bose QuietComfort Headphones (Updated)'}).encode()
    req = urllib.request.Request(f'{BASE}/lost-items/{item_id}', data=update_payload, headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {token}'}, method='PUT')
    with urllib.request.urlopen(req) as resp:
        updated = json.loads(resp.read().decode())
        print(f'[5/6] Updated lost item OK: {updated["title"]}')

    # 6. Delete Lost Item
    req = urllib.request.Request(f'{BASE}/lost-items/{item_id}', headers={'Authorization': f'Bearer {token}'})
    req.get_method = lambda: 'DELETE'
    with urllib.request.urlopen(req) as resp:
        deleted = json.loads(resp.read().decode())
        print(f'[6/6] Deleted lost item OK: {deleted.get("message", deleted)}')

    print('\n=============================================================')
    print('ALL 6 LIVE NETWORK CRUD TESTS PASSED AGAINST UVICORN & POSTGRES!')
    print('=============================================================')

if __name__ == '__main__':
    run_test()
