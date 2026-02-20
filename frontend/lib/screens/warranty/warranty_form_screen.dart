import 'package:flutter/material.dart';

class WarrantyFormScreen extends StatefulWidget {
  const WarrantyFormScreen({super.key});

  @override
  State<WarrantyFormScreen> createState() => _WarrantyFormScreenState();
}

class _WarrantyFormScreenState extends State<WarrantyFormScreen> {
  final _formKey = GlobalKey<FormState>();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Registrar Garantia')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(32),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Formulário de Garantia', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold)),
              const SizedBox(height: 32),
              // Aqui vão os campos do formulário
              TextFormField(decoration: const InputDecoration(labelText: 'Marca')),
              TextFormField(decoration: const InputDecoration(labelText: 'Modelo')),
              TextFormField(decoration: const InputDecoration(labelText: 'Número de Série')),
              TextFormField(decoration: const InputDecoration(labelText: 'Nome Completo')),
              TextFormField(decoration: const InputDecoration(labelText: 'Email')),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () {},
                child: const Text('Registrar Garantia'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
