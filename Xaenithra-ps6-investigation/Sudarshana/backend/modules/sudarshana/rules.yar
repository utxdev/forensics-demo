
                rule DummyMalware {
                    strings:
                        $a = "evil_string"
                    condition:
                        $a
                }
            