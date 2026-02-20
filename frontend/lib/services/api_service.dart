import 'package:dio/dio.dart';

class ApiService {
  final String baseUrl;
  late final Dio _dio;

  ApiService({required this.baseUrl}) {
    _dio = Dio(
      BaseOptions(
        baseUrl: '$baseUrl/api',
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    // Add interceptors
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          print('REQUEST[${options.method}] => PATH: ${options.path}');
          return handler.next(options);
        },
        onResponse: (response, handler) {
          print('RESPONSE[${response.statusCode}] => PATH: ${response.requestOptions.path}');
          return handler.next(response);
        },
        onError: (error, handler) {
          print('ERROR[${error.response?.statusCode}] => PATH: ${error.requestOptions.path}');
          return handler.next(error);
        },
      ),
    );
  }

  // Set token
  void setToken(String token) {
    _dio.options.headers['Authorization'] = 'Bearer $token';
  }

  // Clear token
  void clearToken() {
    _dio.options.headers.remove('Authorization');
  }

  // GET
  Future<Response> get(String path, {Map<String, dynamic>? queryParameters}) {
    return _dio.get(path, queryParameters: queryParameters);
  }

  // POST
  Future<Response> post(String path, {dynamic data}) {
    return _dio.post(path, data: data);
  }

  // PATCH
  Future<Response> patch(String path, {dynamic data}) {
    return _dio.patch(path, data: data);
  }

  // DELETE
  Future<Response> delete(String path) {
    return _dio.delete(path);
  }

  // Health check
  Future<bool> checkHealth() async {
    try {
      final response = await _dio.get('/health');
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }
}
