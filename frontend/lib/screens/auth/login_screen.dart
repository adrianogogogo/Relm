import 'package:flutter/material.dart';

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Login')),
      body: Center(
        child: Card(
          margin: const EdgeInsets.all(32),
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('Login Admin', style: TextStyle(fontSize: 24)),
                const SizedBox(height: 24),
                TextFormField(decoration: const InputDecoration(labelText: 'Email')),
                const SizedBox(height: 16),
                TextFormField(decoration: const InputDecoration(labelText: 'Senha'), obscureText: true),
                const SizedBox(height: 24),
                ElevatedButton(onPressed: () {}, child: const Text('Entrar')),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
