import 'package:flutter/material.dart';

class InsuranceFormScreen extends StatelessWidget {
  const InsuranceFormScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Cotação de Seguro')),
      body: const Center(child: Text('Formulário de seguro...')),
    );
  }
}
