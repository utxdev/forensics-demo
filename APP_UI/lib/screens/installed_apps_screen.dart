import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class InstalledAppsScreen extends StatefulWidget {
  const InstalledAppsScreen({super.key});

  @override
  State<InstalledAppsScreen> createState() => _InstalledAppsScreenState();
}

class _InstalledAppsScreenState extends State<InstalledAppsScreen> {
  static const platform = MethodChannel('com.example.call_logs/logs');
  List<Map<dynamic, dynamic>> _apps = [];
  List<Map<dynamic, dynamic>> _filteredApps = [];
  bool _isLoading = false;
  String _errorMessage = '';
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _getApps();
  }

  Future<void> _getApps() async {
    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    try {
      // Permission QUERY_ALL_PACKAGES is a normal permission in manifest but heavily restricted on Play Store.
      // For local hackathon app, adding it to manifest is enough for Android 11+.
      final List<dynamic> result = await platform.invokeMethod(
        'getInstalledApps',
      );
      setState(() {
        _apps = result.cast<Map<dynamic, dynamic>>();
        _filteredApps = List.from(_apps);
      });
    } on PlatformException catch (e) {
      setState(() {
        _errorMessage = "Failed to get apps: '${e.message}'.";
      });
    } catch (e) {
      setState(() {
        _errorMessage = "An unexpected error occurred: $e";
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _filterApps(String query) {
    setState(() {
      _filteredApps = _apps.where((app) {
        final name = app['name'].toString().toLowerCase();
        final pkg = app['packageName'].toString().toLowerCase();
        final search = query.toLowerCase();
        return name.contains(search) || pkg.contains(search);
      }).toList();
    });
  }

  Future<void> _showAppDetails(Map<dynamic, dynamic> app) async {
    // Show loading dialog first
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(child: CircularProgressIndicator()),
    );

    try {
      final details = await platform.invokeMethod('getAppDetails', {
        'packageName': app['packageName'],
      });
      if (!mounted) return;
      Navigator.pop(context); // Pop loading

      _buildDetailDialog(app, details);
    } catch (e) {
      if (!mounted) return;
      Navigator.pop(context); // Pop loading
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text("Failed to load details: $e")));
    }
  }

  void _buildDetailDialog(
    Map<dynamic, dynamic> app,
    Map<dynamic, dynamic> details,
  ) {
    final rawPermissions = details['permissions'] as List<dynamic>? ?? [];
    final permissions = rawPermissions.cast<Map<dynamic, dynamic>>();

    // Convert Base64 icon
    final iconBase64 = details['icon'] as String?;
    final iconBytes = iconBase64 != null
        ? const Base64Decoder().convert(iconBase64)
        : null;

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            if (iconBytes != null)
              Image.memory(iconBytes, width: 40, height: 40)
            else
              const Icon(Icons.android, size: 40),
            const SizedBox(width: 10),
            Expanded(child: Text(app['name'])),
          ],
        ),
        content: SizedBox(
          width: double.maxFinite,
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildDetailRow("Package", app['packageName']),
                _buildDetailRow("Version", app['version']),
                _buildDetailRow("Installed", app['installDate']),
                _buildDetailRow("Updated", app['updateDate']),
                _buildDetailRow("System App", app['isSystem'].toString()),
                _buildDetailRow("Hidden", app['isHidden'].toString()),
                const Divider(),
                const Text(
                  "Permissions:",
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                if (permissions.isEmpty)
                  const Text(
                    "No permissions requested.",
                    style: TextStyle(fontStyle: FontStyle.italic),
                  ),
                ...permissions.map((p) {
                  final name = p['name'].toString();
                  final isDangerous = p['isDangerous'] == true;
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 2),
                    child: Row(
                      children: [
                        if (isDangerous)
                          const Padding(
                            padding: EdgeInsets.only(right: 6),
                            child: Icon(
                              Icons.warning,
                              color: Colors.red,
                              size: 16,
                            ),
                          ),
                        Expanded(
                          child: Text(
                            name,
                            style: TextStyle(
                              fontSize: 12,
                              color: isDangerous ? Colors.red : null,
                              fontWeight: isDangerous
                                  ? FontWeight.bold
                                  : FontWeight.normal,
                            ),
                          ),
                        ),
                        if (isDangerous)
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 4,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.red,
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: const Text(
                              "SUS",
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 8,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                      ],
                    ),
                  );
                }),
              ],
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text("Close"),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "$label: ",
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
          ),
          Expanded(child: Text(value, style: const TextStyle(fontSize: 13))),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: TextField(
          controller: _searchController,
          style: const TextStyle(color: Colors.white),
          decoration: const InputDecoration(
            hintText: "Search Apps...",
            hintStyle: TextStyle(color: Colors.white70),
            border: InputBorder.none,
            icon: Icon(Icons.search, color: Colors.white),
          ),
          onChanged: _filterApps,
        ),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _getApps),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _errorMessage.isNotEmpty
          ? Center(child: Text(_errorMessage))
          : ListView.builder(
              itemCount: _filteredApps.length,
              itemBuilder: (context, index) {
                final app = _filteredApps[index];
                final isSystem = app['isSystem'] as bool;
                final isHidden = app['isHidden'] as bool;

                return ListTile(
                  leading: CircleAvatar(
                    backgroundColor: isSystem
                        ? Colors.red.withValues(alpha: 0.2)
                        : Colors.blue.withValues(alpha: 0.2),
                    child: Icon(
                      isHidden ? Icons.visibility_off : Icons.android,
                      color: isSystem ? Colors.red : Colors.blue,
                    ),
                  ),
                  title: Text(
                    app['name'],
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  subtitle: Text(app['packageName']),
                  trailing: isSystem
                      ? const Chip(
                          label: Text("System", style: TextStyle(fontSize: 10)),
                        )
                      : null,
                  onTap: () => _showAppDetails(app),
                );
              },
            ),
    );
  }
}
