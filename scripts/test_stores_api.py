import requests
import json

BASE_URL = 'http://177.153.62.248:3005/v1'

# 1. Login as admin@relmbikes.com.br
res_login = requests.post(f'{BASE_URL}/auth/login', json={
    'email': 'admin@relmbikes.com.br',
    'password': '...' # let's check or test
})
print("LOGIN ST:", res_login.status_code, res_login.text)

# Let's test GET /v1/public/stores
res_pub = requests.get(f'{BASE_URL}/public/stores')
print("PUBLIC STORES ST:", res_pub.status_code)
print(res_pub.text[:500])
