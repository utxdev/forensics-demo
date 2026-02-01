import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:share_plus/share_plus.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Call Logs App',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.teal),
        useMaterial3: true,
      ),
      home: const CallLogPage(),
    );
  }
}

class CallLogPage extends StatefulWidget {
  const CallLogPage({super.key});

  @override
  State<CallLogPage> createState() => _CallLogPageState();
}

class _CallLogPageState extends State<CallLogPage> {
  static const platform = MethodChannel('com.example.call_logs/logs');
  List<Map<dynamic, dynamic>> _callLogs = [];
  Map<String, bool> _spamStatus = {};
  bool _isLoading = false;
  String _errorMessage = '';

  @override
  void initState() {
    super.initState();
    _getCallLogs();
  }

  Future<void> _getCallLogs() async {
    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    try {
      if (await _requestPermission()) {
        final List<dynamic> result = await platform.invokeMethod('getCallLogs');
        setState(() {
          _callLogs = result.cast<Map<dynamic, dynamic>>();
        });
        _checkSpamBatch();
      } else {
        setState(() {
          _errorMessage = "Permission denied to access call logs.";
        });
      }
    } on PlatformException catch (e) {
      setState(() {
        _errorMessage = "Failed to get call logs: '${e.message}'.";
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

  Future<void> _checkSpamBatch() async {
    final uniqueNumbers = _callLogs
        .map((log) => log['number'].toString())
        .toSet()
        .where((n) => n.isNotEmpty && n != 'Unknown')
        .toList();

    const int chunkSize = 100;
    for (var i = 0; i < uniqueNumbers.length; i += chunkSize) {
      final chunk = uniqueNumbers.sublist(
        i,
        i + chunkSize > uniqueNumbers.length
            ? uniqueNumbers.length
            : i + chunkSize,
      );
      await _fetchSpamStatus(chunk);
    }
  }

  Future<void> _fetchSpamStatus(List<String> numbers) async {
    try {
      final response = await http.post(
        Uri.parse('https://spam.skipcalls.app/check/bulk'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'numbers': numbers}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final List<dynamic> results = data['results'];
        setState(() {
          for (var item in results) {
            _spamStatus[item['number']] = item['isSpam'];
          }
        });
      }
    } catch (e) {
      debugPrint("Error checking spam: $e");
    }
  }

  Future<bool> _requestPermission() async {
    Map<Permission, PermissionStatus> statuses = await [
      Permission.phone,
      Permission.contacts,
    ].request();

    return statuses[Permission.phone]?.isGranted ?? false;
  }

  Future<void> _exportLogs() async {
    if (_callLogs.isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('No logs to export.')));
      return;
    }

    try {
      final StringBuffer csvContent = StringBuffer();
      csvContent.writeln("Number,Name,Type,Date,Duration,IsSpam");

      for (var log in _callLogs) {
        final number = log['number'];
        final isSpam = _spamStatus[number] == true ? 'Yes' : 'No';
        csvContent.writeln(
          "${log['number']},${log['name']},${log['type']},${log['date']},${log['duration']},$isSpam",
        );
      }

      final directory = await getTemporaryDirectory();
      final file = File('${directory.path}/call_logs.csv');
      await file.writeAsString(csvContent.toString());

      await Share.shareXFiles([XFile(file.path)], text: 'Call Logs');
    } catch (e) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Failed to export logs: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Call History'),
        actions: [
          IconButton(onPressed: _exportLogs, icon: const Icon(Icons.share)),
          IconButton(onPressed: _getCallLogs, icon: const Icon(Icons.refresh)),
        ],
      ),
      body: _isLoading && _callLogs.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : _errorMessage.isNotEmpty
          ? Center(
              child: Padding(
                padding: EdgeInsets.all(16.0),
                child: Text(_errorMessage, textAlign: TextAlign.center),
              ),
            )
          : _callLogs.isEmpty
          ? const Center(child: Text("No call logs found."))
          : ListView.builder(
              itemCount: _callLogs.length,
              itemBuilder: (context, index) {
                final log = _callLogs[index];
                final number = log['number'];
                final isSpam = _spamStatus[number] == true;

                return ListTile(
                  leading: _getIcon(log['type']),
                  title: Row(
                    children: [
                      Text(
                        number ?? 'Unknown',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      if (isSpam) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.red,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text(
                            'SPAM',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  subtitle: Text('${log['date']} • ${log['duration']}s'),
                  trailing: const Icon(Icons.info_outline),
                  onTap: () => _showCallDetails(context, log),
                );
              },
            ),
    );
  }

  Icon _getIcon(String? type, {double size = 24}) {
    if (type == 'INCOMING') {
      return Icon(Icons.call_received, color: Colors.green, size: size);
    }
    if (type == 'OUTGOING') {
      return Icon(Icons.call_made, color: Colors.blue, size: size);
    }
    if (type == 'MISSED') {
      return Icon(Icons.call_missed, color: Colors.red, size: size);
    }
    return Icon(Icons.call, size: size);
  }

  Color _getColor(String? type) {
    if (type == 'INCOMING') return Colors.green;
    if (type == 'OUTGOING') return Colors.blue;
    if (type == 'MISSED') return Colors.red;
    return Colors.grey;
  }

  void _showCallDetails(BuildContext context, Map<dynamic, dynamic> log) {
    final themeColor = _getColor(log['type']);
    final isSpam = _spamStatus[log['number']] == true;

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        titlePadding: EdgeInsets.zero,
        clipBehavior: Clip.antiAlias,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12.0),
        ),
        title: Container(
          color: themeColor,
          padding: const EdgeInsets.all(16.0),
          child: Row(
            children: [
              _getIcon(log['type'], size: 28),
              const SizedBox(width: 8),
              const Text(
                'Call Details',
                style: TextStyle(color: Colors.white, fontSize: 18),
              ),
              if (isSpam) ...[
                const Spacer(),
                const Chip(
                  label: Text(
                    'SPAM',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  backgroundColor: Colors.red,
                  side: BorderSide.none,
                ),
              ],
            ],
          ),
        ),
        content: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: ListBody(
              children: [
                _buildDetailRow(
                  "Number",
                  log['number'],
                  _getColor(log['type']),
                ),
                if (log['name'] != null && log['name'].toString().isNotEmpty)
                  _buildDetailRow("Name", log['name'], _getColor(log['type'])),
                const Divider(),
                _buildDetailRow("Type", log['type'], _getColor(log['type'])),
                _buildDetailRow("Date", log['date'], _getColor(log['type'])),
                _buildDetailRow(
                  "Duration",
                  "${log['duration']} seconds",
                  _getColor(log['type']),
                ),
              ],
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            style: TextButton.styleFrom(foregroundColor: themeColor),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String? value, Color color) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2.0),
      child: Text.rich(
        TextSpan(
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 12),
          children: [
            TextSpan(
              text: "$label: ",
              style: TextStyle(fontWeight: FontWeight.bold, color: color),
            ),
            TextSpan(
              text: value ?? "N/A",
              style: TextStyle(color: Colors.black),
            ),
          ],
        ),
      ),
    );
  }
}
