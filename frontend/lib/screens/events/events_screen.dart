import 'package:flutter/material.dart';

class EventsScreen extends StatelessWidget {
  const EventsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Eventos Relm')),
      body: const Center(child: Text('Lista de eventos...')),
    );
  }
}
