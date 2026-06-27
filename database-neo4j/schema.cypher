CREATE (l1:Location {id: "L1", name: "Main Street Intersect", status: "CLEAR"})
CREATE (l2:Location {id: "Location 2", name: "Park Road Cross", status: "CLEAR"})
CREATE (l3:Location {id: "L3", name: "Metro Station Hub", status: "CLEAR"})
CREATE (l4:Location {id: "L4", name: "Low-Lying Boulevard", status: "CLEAR"})

CREATE (l1)-[:CONNECTED_TO {distance_meters: 1200}]->(l2)
CREATE (l2)-[:CONNECTED_TO {distance_meters: 1200}]->(l1)
CREATE (l2)-[:CONNECTED_TO {distance_meters: 850}]->(l3)
CREATE (l3)-[:CONNECTED_TO {distance_meters: 850}]->(l2)
CREATE (l1)-[:CONNECTED_TO {distance_meters: 3100}]->(l4)
CREATE (l4)-[:CONNECTED_TO {distance_meters: 3100}]->(l1)
CREATE (l3)-[:CONNECTED_TO {distance_meters: 1500}]->(l4)
CREATE (l4)-[:CONNECTED_TO {distance_meters: 1500}]->(l3)

CREATE (l2)-[:DRAINS_INTO {pipe_capacity_liters_sec: 4500}]->(l4);