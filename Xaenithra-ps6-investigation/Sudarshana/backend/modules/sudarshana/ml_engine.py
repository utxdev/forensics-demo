from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import numpy as np
import yara
import os

class MLEngine:
    def __init__(self):
        # Simulating training data: timestamps of logs (seconds from midnight)
        # Normal behavior: 9am-5pm (32400-61200)
        # Anomaly: 3am (10800)
        normal_data = np.random.normal(loc=45000, scale=5000, size=100)
        self.data = normal_data.reshape(-1, 1)
        self.scaler = StandardScaler()
        self.kms = KMeans(n_clusters=2)
        self._train()
        
        self.rules = None
        self._load_yara_rules()

    def _train(self):
        scaled_data = self.scaler.fit_transform(self.data)
        self.kms.fit(scaled_data)

    def _load_yara_rules(self):
        rule_path = os.path.join(os.path.dirname(__file__), "rules.yar")
        if os.path.exists(rule_path):
            try:
                self.rules = yara.compile(filepath=rule_path)
            except Exception as e:
                print(f"Failed to load YARA rules: {e}")
        else:
            # Create dummy rule if not exists
            dummy_rule = """
                rule DummyMalware {
                    strings:
                        $a = "evil_string"
                    condition:
                        $a
                }
            """
            with open(rule_path, "w") as f:
                f.write(dummy_rule)
            self.rules = yara.compile(filepath=rule_path)

    def analyze_behavior(self, timestamp):
        """
        Returns anomaly score (0 = normal, 1 = anomaly)
        timestamp: Time of day in seconds
        """
        scaled = self.scaler.transform(np.array([[timestamp]]))
        prediction = self.kms.predict(scaled)
        # Assuming cluster 0 is normal (based on majority). 
        # In real app, we'd check distance to centroid.
        # This is a simplified demo logic.
        dist = self.kms.transform(scaled)
        min_dist = np.min(dist)
        
        # If distance is large, it's an anomaly regardless of cluster
        if min_dist > 2.0:
            return True # Anomaly
        return False

    def scan_file(self, file_path):
        if not self.rules: return []
        try:
            matches = self.rules.match(file_path)
            return [m.rule for m in matches]
        except:
            return []

ml_engine = MLEngine()
