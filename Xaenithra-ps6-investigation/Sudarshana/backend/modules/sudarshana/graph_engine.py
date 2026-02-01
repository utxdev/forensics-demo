import networkx as nx
import collections

class GraphEngine:
    def __init__(self):
        self.G = nx.Graph()

    def add_interaction(self, source, target, type="call"):
        if not source or not target: return
        
        if self.G.has_edge(source, target):
            self.G[source][target]['weight'] += 1
        else:
            self.G.add_edge(source, target, weight=1, type=type)

    def get_graph_data(self):
        """Returns JSON compatible graph data."""
        nodes = [{"id": n, "centrality": 0} for n in self.G.nodes()]
        links = [{"source": u, "target": v, "weight": d['weight']} for u, v, d in self.G.edges(data=True)]
        
        # Calculate centrality
        if len(nodes) > 0:
            centrality = nx.degree_centrality(self.G)
            for node in nodes:
                node["centrality"] = centrality.get(node["id"], 0)
                
        return {"nodes": nodes, "links": links}

    def get_high_value_targets(self):
        """Returns nodes with high centrality (Criminal Kingpins?)."""
        if len(self.G.nodes) == 0: return []
        centrality = nx.betweenness_centrality(self.G)
        sorted_nodes = sorted(centrality.items(), key=lambda x: x[1], reverse=True)
        return sorted_nodes[:5] # Top 5

graph_engine = GraphEngine()
