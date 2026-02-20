import 'package:flutter/material.dart';

class NewsletterScreen extends StatelessWidget {
  const NewsletterScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Newsletter')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text('Inscreva-se na Newsletter', style: TextStyle(fontSize: 24)),
              const SizedBox(height: 24),
              TextFormField(decoration: const InputDecoration(labelText: 'Email')),
              const SizedBox(height: 24),
              ElevatedButton(onPressed: () {}, child: const Text('Inscrever')),
            ],
          ),
        ),
      ),
    );
  }
}
