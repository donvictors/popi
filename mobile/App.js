import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Linking, Modal, ScrollView, ActivityIndicator, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import axios from 'axios';
import { API_URL, DEFAULT_COORDS, RADII } from './src/config';

const CATEGORY_COLORS = {
  PUBLICO: '#0f9d58',
  PAGADO: '#f4b400',
  ASOCIADO_A_LOCAL: '#4285f4',
  DESCONOCIDO: '#9e9e9e',
};

export default function App() {
  const [location, setLocation] = useState(null);
  const [region, setRegion] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [toilets, setToilets] = useState([]);
  const [radius, setRadius] = useState(RADII[0]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [reportStatus, setReportStatus] = useState(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permiso de ubicación denegado. Usando Santiago centro como referencia.');
        setRegion({
          latitude: DEFAULT_COORDS.lat,
          longitude: DEFAULT_COORDS.lng,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        });
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setLocation(loc.coords);
      setRegion(coords);
    })();
  }, []);

  useEffect(() => {
    if (region) {
      fetchToilets();
    }
  }, [region?.latitude, region?.longitude, radius, refreshIndex]);

  const fetchToilets = async () => {
    if (!region) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const params = {
        lat: region.latitude,
        lng: region.longitude,
        radius,
      };
      const { data } = await axios.get(`${API_URL}/toilets`, { params });
      setToilets(data.items || []);
      if ((data.items || []).length === 0) {
        setErrorMsg('No hay resultados en este radio. Prueba con 500m o 1000m.');
      }
    } catch (error) {
      console.error(error);
      setErrorMsg('No se pudo obtener baños cercanos. Revisa tu conexión o intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const nearest = useMemo(() => {
    if (!toilets.length) return null;
    return toilets.reduce((prev, curr) => (prev.distance_m < curr.distance_m ? prev : curr));
  }, [toilets]);

  const handleNearest = () => {
    if (!nearest) return;
    setSelected(nearest);
    setRegion({
      latitude: nearest.lat,
      longitude: nearest.lng,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    });
  };

  const handleDirections = (item) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lng}&travelmode=walking`;
    Linking.openURL(url);
  };

  const handleReport = async (item, status) => {
    try {
      await axios.post(`${API_URL}/reports`, {
        toilet_id: item.id,
        lat: item.lat,
        lng: item.lng,
        status,
      });
      setReportStatus(status);
      Alert.alert('¡Gracias!', 'Tu reporte fue enviado.');
    } catch (error) {
      Alert.alert('Error', 'No se pudo enviar el reporte.');
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.listItem} onPress={() => setSelected(item)}>
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>{item.name}</Text>
        <View style={[styles.badge, { backgroundColor: CATEGORY_COLORS[item.category] || '#999' }]}>
          <Text style={styles.badgeText}>{item.category}</Text>
        </View>
      </View>
      <Text style={styles.listSubtitle}>{item.distance_m} m • {item.address || 'Sin dirección'}</Text>
      {item.fee && <Text style={styles.fee}>Fee: {item.fee}</Text>}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {region ? (
        <MapView
          style={styles.map}
          region={region}
          onRegionChangeComplete={setRegion}
          provider={MapView.PROVIDER_GOOGLE}
        >
          {toilets.map((item) => (
            <Marker
              key={item.id}
              coordinate={{ latitude: item.lat, longitude: item.lng }}
              title={item.name}
              description={`${item.category} • ${item.distance_m} m`}
              pinColor={CATEGORY_COLORS[item.category]}
              onPress={() => setSelected(item)}
            />
          ))}
          {location && (
            <Marker
              coordinate={{ latitude: location.latitude, longitude: location.longitude }}
              title="Tú"
              pinColor="#000"
            />
          )}
        </MapView>
      ) : (
        <View style={styles.placeholder}> 
          <Text>Obteniendo ubicación en Santiago...</Text>
        </View>
      )}

      <View style={styles.controls}>
        <View style={styles.radiusRow}>
          {RADII.map((value) => (
            <TouchableOpacity
              key={value}
              style={[styles.radiusButton, radius === value && styles.radiusButtonActive]}
              onPress={() => setRadius(value)}
            >
              <Text style={radius === value ? styles.radiusTextActive : styles.radiusText}>{value}m</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.refreshButton} onPress={() => setRefreshIndex((i) => i + 1)}>
            <Text style={styles.refreshText}>Recargar</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.nearestButton} onPress={handleNearest} disabled={!nearest}>
          <Text style={styles.nearestText}>{nearest ? 'Encontrar más cercano' : 'Esperando datos...'}</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator style={styles.loader} size="large" color="#4285f4" />}
      {!!errorMsg && <Text style={styles.error}>{errorMsg}</Text>}

      <FlatList
        data={toilets}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        style={styles.list}
      />

      <Modal visible={!!selected} animationType="slide" onRequestClose={() => setSelected(null)}>
        <ScrollView style={styles.modalContent}>
          {selected && (
            <>
              <Text style={styles.modalTitle}>{selected.name}</Text>
              <Text style={styles.modalSubtitle}>{selected.address || 'Sin dirección'}</Text>
              <Text style={styles.modalDetail}>Distancia: {selected.distance_m} m</Text>
              <Text style={styles.modalDetail}>Categoría: {selected.category}</Text>
              {selected.secondaryBadges?.length > 0 && (
                <Text style={styles.modalDetail}>Badges: {selected.secondaryBadges.join(', ')}</Text>
              )}
              {selected.fee && <Text style={styles.modalDetail}>Fee: {selected.fee}</Text>}
              {selected.wheelchair && <Text style={styles.modalDetail}>Accesibilidad: {selected.wheelchair}</Text>}
              {selected.opening_hours && <Text style={styles.modalDetail}>Horario: {selected.opening_hours}</Text>}
              <Text style={styles.modalDetail}>Tags crudos: {JSON.stringify(selected.tags_raw).slice(0, 280)}...</Text>

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.actionButton} onPress={() => handleDirections(selected)}>
                  <Text style={styles.actionText}>Cómo llegar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => setSelected(null)}>
                  <Text>Cerrar</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionTitle}>Reportar estado</Text>
              <View style={styles.reportRow}>
                {['LIMPIO', 'SUCIO', 'CERRADO'].map((status) => (
                  <TouchableOpacity key={status} style={styles.reportButton} onPress={() => handleReport(selected, status)}>
                    <Text>{status}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {reportStatus && <Text>Último envío: {reportStatus}</Text>}
            </>
          )}
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  map: { width: '100%', height: 250 },
  placeholder: { height: 250, alignItems: 'center', justifyContent: 'center' },
  controls: { padding: 12 },
  radiusRow: { flexDirection: 'row', alignItems: 'center' },
  radiusButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ccc', marginRight: 8 },
  radiusButtonActive: { backgroundColor: '#e3f2fd', borderColor: '#4285f4' },
  radiusText: { color: '#333' },
  radiusTextActive: { color: '#4285f4', fontWeight: 'bold' },
  refreshButton: { padding: 8, backgroundColor: '#f1f3f4', borderRadius: 8 },
  refreshText: { color: '#333' },
  nearestButton: { marginTop: 10, padding: 12, backgroundColor: '#4285f4', borderRadius: 8 },
  nearestText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
  loader: { marginVertical: 8 },
  error: { color: '#d32f2f', paddingHorizontal: 12 },
  list: { flex: 1, paddingHorizontal: 12 },
  listItem: { paddingVertical: 10, borderBottomColor: '#eee', borderBottomWidth: 1 },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  listTitle: { fontWeight: 'bold', fontSize: 16, flex: 1, marginRight: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  listSubtitle: { color: '#555', marginTop: 4 },
  fee: { color: '#f57c00', marginTop: 2 },
  modalContent: { padding: 16, backgroundColor: '#fff', flex: 1 },
  modalTitle: { fontSize: 22, fontWeight: 'bold' },
  modalSubtitle: { color: '#666', marginBottom: 8 },
  modalDetail: { marginBottom: 6 },
  modalButtons: { flexDirection: 'row', marginVertical: 12 },
  actionButton: { backgroundColor: '#34a853', padding: 12, borderRadius: 8, marginRight: 8 },
  actionText: { color: '#fff', fontWeight: 'bold' },
  secondaryButton: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ccc' },
  sectionTitle: { marginTop: 12, fontWeight: 'bold', fontSize: 16 },
  reportRow: { flexDirection: 'row', marginVertical: 8 },
  reportButton: { padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ccc', marginRight: 8 },
});
