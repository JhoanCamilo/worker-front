import { getServicioDetalle, ServicioResponse } from "@/src/services/servicio.service";
import { getSolicitudDetalle } from "@/src/services/solicitud.service";
import { useAuthStore } from "@/src/store/auth.store";
import { UserRole } from "@/src/types/auth.types";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function DetalleServicioScreen() {
  const router = useRouter();
  const { idServicio, idSolicitud } = useLocalSearchParams<{ idServicio?: string; idSolicitud?: string }>();
  const user = useAuthStore((s) => s.user);
  const isTech = user?.role === UserRole.TECH;

  const [servicio, setServicio] = useState<ServicioResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetalle = async () => {
      try {
        let currentIdServicio = idServicio ? Number(idServicio) : null;

        if (!currentIdServicio && idSolicitud) {
          const req = await getSolicitudDetalle(Number(idSolicitud));
          if (req.servicios_generados && req.servicios_generados.length > 0) {
            currentIdServicio = req.servicios_generados[0].id_servicio;
          }
        }

        if (!currentIdServicio) {
          setError("No se pudo localizar el servicio asociado.");
          return;
        }

        const data = await getServicioDetalle(currentIdServicio);
        setServicio(data);
      } catch (e) {
        setError("No se pudo cargar el detalle del servicio.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetalle();
  }, [idServicio, idSolicitud]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isWarrantyActive = (expirationDate: string) => {
    const expires = new Date(expirationDate);
    const now = new Date();
    return expires > now;
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#407ee3" />
        <Text style={styles.loadingText}>Cargando detalle...</Text>
      </View>
    );
  }

  if (error || !servicio) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={styles.errorText}>{error || "Servicio no encontrado"}</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.back()}>
          <Text style={styles.btnText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const estado = servicio.estado?.descripcion || "DESCONOCIDO";
  const garantia = servicio.garantia;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Servicio #{servicio.id_servicio}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Main Info Card */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Estado</Text>
            <View
              style={[
                styles.badge,
                estado.toUpperCase() === "COMPLETADA" ||
                estado.toUpperCase() === "FINALIZADA"
                  ? styles.badgeSuccess
                  : styles.badgeDefault,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  estado.toUpperCase() === "COMPLETADA" ||
                  estado.toUpperCase() === "FINALIZADA"
                    ? styles.badgeSuccessText
                    : styles.badgeDefaultText,
                ]}
              >
                {estado.charAt(0) + estado.slice(1).toLowerCase()}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.rowBetween}>
            <Text style={styles.label}>Valor total</Text>
            <Text style={styles.valueLarge}>
              ${servicio.valor_total?.toLocaleString("es-CO") || "0"}
            </Text>
          </View>

          {!isTech && servicio.tecnico && (
            <>
              <View style={styles.divider} />
              <View>
                <Text style={styles.label}>Profesional asignado</Text>
                <View style={styles.tecnicoRow}>
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={20} color="#9ca3af" />
                  </View>
                  <View>
                    <Text style={styles.value}>
                      {servicio.tecnico.nombre} {servicio.tecnico.apellido}
                    </Text>
                    <View style={styles.starsRow}>
                      <Ionicons name="star" size={12} color="#f59e0b" />
                      <Text style={styles.starsText}>
                        {servicio.tecnico.prom_calificacion?.toFixed(1) || "Nuevo"}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Warranty Card */}
        {garantia && (
          <View
            style={[
              styles.card,
              isWarrantyActive(garantia.fecha_expiracion)
                ? styles.warrantyActive
                : styles.warrantyExpired,
            ]}
          >
            <View style={styles.warrantyHeader}>
              <Ionicons
                name={
                  isWarrantyActive(garantia.fecha_expiracion)
                    ? "shield-checkmark"
                    : "shield-half"
                }
                size={28}
                color={
                  isWarrantyActive(garantia.fecha_expiracion)
                    ? "#16a34a"
                    : "#6b7280"
                }
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.warrantyTitle,
                    !isWarrantyActive(garantia.fecha_expiracion) && {
                      color: "#4b5563",
                    },
                  ]}
                >
                  {isWarrantyActive(garantia.fecha_expiracion)
                    ? "Garantía Activa"
                    : "Garantía Expirada"}
                </Text>
                <Text style={styles.warrantySub}>
                  Válida hasta el {formatDate(garantia.fecha_expiracion)}
                </Text>
              </View>
            </View>

            <View style={styles.warrantyBody}>
              <Text style={styles.warrantyText}>
                {isWarrantyActive(garantia.fecha_expiracion)
                  ? "Este servicio cuenta con garantía activa por cualquier anomalía relacionada con el trabajo realizado."
                  : "El periodo de garantía de este servicio ya ha finalizado."}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  loadingText: { marginTop: 12, color: "#6b7280", fontSize: 16 },
  errorText: { marginTop: 12, color: "#ef4444", fontSize: 16, textAlign: "center" },
  container: { flex: 1, backgroundColor: "#f9fafb" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1f2937" },

  content: { padding: 16 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: { fontSize: 14, color: "#6b7280", marginBottom: 4 },
  value: { fontSize: 16, color: "#1f2937", fontWeight: "600" },
  valueLarge: { fontSize: 24, color: "#407ee3", fontWeight: "700" },
  divider: { height: 1, backgroundColor: "#f3f4f6", marginVertical: 16 },

  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: "600" },

  badgeSuccess: { backgroundColor: "#dcfce7" },
  badgeSuccessText: { color: "#16a34a" },
  badgeDefault: { backgroundColor: "#f3f4f6" },
  badgeDefaultText: { color: "#4b5563" },

  tecnicoRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 4 },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  starsRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  starsText: { fontSize: 13, color: "#6b7280" },

  warrantyActive: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  warrantyExpired: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  warrantyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  warrantyTitle: { fontSize: 18, fontWeight: "700", color: "#16a34a" },
  warrantySub: { fontSize: 14, color: "#6b7280", marginTop: 2 },
  warrantyBody: { paddingLeft: 40 },
  warrantyText: { fontSize: 14, color: "#4b5563", lineHeight: 20 },

  btn: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#407ee3",
    borderRadius: 8,
  },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
