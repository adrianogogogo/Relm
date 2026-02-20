import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart';

class AuthService extends ChangeNotifier {
  final ApiService _apiService;
  String? _accessToken;
  String? _refreshToken;
  Map<String, dynamic>? _user;
  bool _isAuthenticated = false;

  AuthService(this._apiService) {
    _loadTokens();
  }

  bool get isAuthenticated => _isAuthenticated;
  Map<String, dynamic>? get user => _user;
  String? get userRole => _user?['role'];

  Future<void> _loadTokens() async {
    final prefs = await SharedPreferences.getInstance();
    _accessToken = prefs.getString('access_token');
    _refreshToken = prefs.getString('refresh_token');
    final userJson = prefs.getString('user');

    if (_accessToken != null && userJson != null) {
      _apiService.setToken(_accessToken!);
      _user = _parseJson(userJson);
      _isAuthenticated = true;
      notifyListeners();
    }
  }

  Map<String, dynamic>? _parseJson(String json) {
    try {
      return Map<String, dynamic>.from(
        const JsonDecoder().convert(json) as Map,
      );
    } catch (e) {
      return null;
    }
  }

  Future<bool> login(String email, String password) async {
    try {
      final response = await _apiService.post('/auth/login', data: {
        'email': email,
        'password': password,
      });

      if (response.statusCode == 200 || response.statusCode == 201) {
        _accessToken = response.data['access_token'];
        _refreshToken = response.data['refresh_token'];
        _user = response.data['user'];

        await _saveTokens();
        _apiService.setToken(_accessToken!);
        _isAuthenticated = true;
        notifyListeners();
        return true;
      }
      return false;
    } catch (e) {
      print('Login error: $e');
      return false;
    }
  }

  Future<void> _saveTokens() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('access_token', _accessToken ?? '');
    await prefs.setString('refresh_token', _refreshToken ?? '');
    await prefs.setString('user', _user.toString());
  }

  Future<void> logout() async {
    try {
      await _apiService.post('/auth/logout');
    } catch (e) {
      print('Logout error: $e');
    }

    _accessToken = null;
    _refreshToken = null;
    _user = null;
    _isAuthenticated = false;

    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();

    _apiService.clearToken();
    notifyListeners();
  }

  Future<bool> refreshAccessToken() async {
    if (_refreshToken == null) return false;

    try {
      final response = await _apiService.post('/auth/refresh', data: {
        'refresh_token': _refreshToken,
      });

      if (response.statusCode == 200 || response.statusCode == 201) {
        _accessToken = response.data['access_token'];
        await _saveTokens();
        _apiService.setToken(_accessToken!);
        return true;
      }
      return false;
    } catch (e) {
      print('Refresh token error: $e');
      await logout();
      return false;
    }
  }
}
