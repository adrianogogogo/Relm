import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Relm Care+', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          TextButton.icon(
            onPressed: () => context.go('/login'),
            icon: const Icon(Icons.login, color: Colors.white),
            label: const Text('Login', style: TextStyle(color: Colors.white)),
          ),
          const SizedBox(width: 16),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Hero Section
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(64),
              color: const Color(0xFF00BCD4).withOpacity(0.1),
              child: Column(
                children: [
                  const Text(
                    'Centro de Serviços Relm Bikes',
                    style: TextStyle(
                      fontSize: 42,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF00BCD4),
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Garantia • Vantagens • Seguro • Eventos',
                    style: TextStyle(
                      fontSize: 20,
                      color: Colors.grey.shade700,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 32),
                  ElevatedButton(
                    onPressed: () => context.go('/garantia'),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 48, vertical: 20),
                      backgroundColor: const Color(0xFF4CAF50),
                    ),
                    child: const Text(
                      'Registrar Garantia',
                      style: TextStyle(fontSize: 18),
                    ),
                  ),
                ],
              ),
            ),

            // Services Grid
            Padding(
              padding: const EdgeInsets.all(64),
              child: GridView.count(
                crossAxisCount: MediaQuery.of(context).size.width > 1024 ? 4 : 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 24,
                crossAxisSpacing: 24,
                children: [
                  _ServiceCard(
                    icon: Icons.verified_user,
                    title: 'Garantia',
                    description: 'Registre seu produto e tenha tranquilidade',
                    onTap: () => context.go('/garantia'),
                  ),
                  _ServiceCard(
                    icon: Icons.card_giftcard,
                    title: 'Clube de Vantagens',
                    description: 'Benefícios exclusivos para você',
                    onTap: () => context.go('/vantagens'),
                  ),
                  _ServiceCard(
                    icon: Icons.security,
                    title: 'Seguro',
                    description: 'Proteja sua bike com seguro',
                    onTap: () => context.go('/seguro'),
                  ),
                  _ServiceCard(
                    icon: Icons.event,
                    title: 'Eventos',
                    description: 'Participe dos eventos Relm',
                    onTap: () => context.go('/eventos'),
                  ),
                ],
              ),
            ),

            // Newsletter
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(64),
              color: Colors.grey.shade100,
              child: Column(
                children: [
                  const Text(
                    'Fique por dentro das novidades',
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () => context.go('/newsletter'),
                    child: const Text('Inscrever na Newsletter'),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ServiceCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;
  final VoidCallback onTap;

  const _ServiceCard({
    required this.icon,
    required this.title,
    required this.description,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 64, color: const Color(0xFF00BCD4)),
              const SizedBox(height: 16),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                description,
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey.shade600,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
