import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';

// Screens
import 'screens/home/home_screen.dart';
import 'screens/warranty/warranty_form_screen.dart';
import 'screens/benefits/benefits_screen.dart';
import 'screens/events/events_screen.dart';
import 'screens/newsletter/newsletter_screen.dart';
import 'screens/insurance/insurance_form_screen.dart';
import 'screens/auth/login_screen.dart';
import 'screens/admin/admin_dashboard_screen.dart';

// Services
import 'services/api_service.dart';
import 'services/auth_service.dart';

void main() {
  runApp(const RelmCarePlusApp());
}

class RelmCarePlusApp extends StatelessWidget {
  const RelmCarePlusApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        Provider<ApiService>(
          create: (_) => ApiService(
            baseUrl: const String.fromEnvironment(
              'API_URL',
              defaultValue: 'http://localhost:3003',
            ),
          ),
        ),
        ChangeNotifierProvider<AuthService>(
          create: (context) => AuthService(context.read<ApiService>()),
        ),
      ],
      child: MaterialApp.router(
        title: 'Relm Care+',
        debugShowCheckedModeBanner: false,
        theme: _buildTheme(),
        routerConfig: _router,
      ),
    );
  }

  ThemeData _buildTheme() {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: const Color(0x00BCD4),
        primary: const Color(0xFF00BCD4), // Teal
        secondary: const Color(0xFF4CAF50), // Verde
      ),
      textTheme: GoogleFonts.robotoTextTheme(),
      appBarTheme: const AppBarTheme(
        backgroundColor: Color(0xFF00BCD4),
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF00BCD4),
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
          ),
          textStyle: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      cardTheme: CardTheme(
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
          side: BorderSide(color: Colors.grey.shade300),
        ),
      ),
    );
  }

  GoRouter get _router => GoRouter(
        initialLocation: '/',
        routes: [
          GoRoute(
            path: '/',
            builder: (context, state) => const HomeScreen(),
          ),
          GoRoute(
            path: '/garantia',
            builder: (context, state) => const WarrantyFormScreen(),
          ),
          GoRoute(
            path: '/vantagens',
            builder: (context, state) => const BenefitsScreen(),
          ),
          GoRoute(
            path: '/eventos',
            builder: (context, state) => const EventsScreen(),
          ),
          GoRoute(
            path: '/seguro',
            builder: (context, state) => const InsuranceFormScreen(),
          ),
          GoRoute(
            path: '/newsletter',
            builder: (context, state) => const NewsletterScreen(),
          ),
          GoRoute(
            path: '/login',
            builder: (context, state) => const LoginScreen(),
          ),
          GoRoute(
            path: '/admin',
            builder: (context, state) => const AdminDashboardScreen(),
          ),
        ],
      );
}
