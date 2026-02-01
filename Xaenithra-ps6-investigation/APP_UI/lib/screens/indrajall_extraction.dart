import 'package:flutter/material.dart';
import 'call_logs_screen.dart';
import 'message_logs_screen.dart';
import 'media_extraction_screen.dart';
import 'installed_apps_screen.dart';

class IndrajallScreen extends StatelessWidget {
  const IndrajallScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.bolt, size: 80, color: Colors.blueAccent),
          const SizedBox(height: 20),
          const Text(
            "Indrajaal Mobile Extraction",
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 20),
          ElevatedButton.icon(
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const CallLogScreen()),
              );
            },
            icon: const Icon(Icons.phone_in_talk),
            label: const Text("Call Logs"),
          ),
          const SizedBox(height: 20),
          ElevatedButton.icon(
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const MessageLogsScreen(),
                ),
              );
            },
            icon: const Icon(Icons.message),
            label: const Text("Message Logs"),
          ),
          const SizedBox(height: 20),
          ElevatedButton.icon(
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const MediaExtractionScreen(),
                ),
              );
            },
            icon: const Icon(Icons.folder_open),
            label: const Text("Media Files"),
          ),
          const SizedBox(height: 20),
          ElevatedButton.icon(
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const InstalledAppsScreen(),
                ),
              );
            },
            icon: const Icon(Icons.apps),
            label: const Text("Installed Apps"),
          ),
        ],
      ),
    );
  }
}
