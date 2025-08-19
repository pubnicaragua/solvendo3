import React, { useState, useEffect } from "react";
import { Printer, Search, FileText } from "lucide-react";
import { HeaderWithMenu } from "../components/common/HeaderWithMenu";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

interface Document {
  id: string;
  folio: string;
  tipo: string;
  total: number;
  fecha: string;
}

export const ReprintPage: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  // Aseguramos que today siempre esté en formato 'YYYY-MM-DD'
  const today = new Date().toISOString().split("T")[0];

  const [fecha, setFecha] = useState(today);
  const [searchFolio, setSearchFolio] = useState("");
  const [docs, setDocs] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [copies, setCopies] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [printableDoc, setPrintableDoc] = useState("")

  // Obtener datos del usuario y empresa del contexto de autenticación
  const { user, empresaId } = useAuth();

  useEffect(() => {
    loadDocs();
  }, [fecha]);

  const loadDocs = async () => {
    setLoading(true);
    setDocs([]); // Limpiar documentos anteriores
    try {
      try {
        // Cargar documentos
        const { data, error } = await supabase
          .from("ventas")
          .select("id, folio, tipo_dte, total, created_at")
          .eq("empresa_id", empresaId)
          .gte("created_at", `${fecha} 00:00:00`)
          .lt("created_at", `${fecha} 23:59:59`)
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }

        if (data && data.length > 0) {
          setDocs(
            data.map((d) => ({
              id: d.id,
              folio: d.folio,
              tipo:
                d.tipo_dte === "Boleta"
                  ? "Boleta manual (no válida al SII)"
                  : "Documento electrónico",
              total: d.total,
              fecha: d.created_at || new Date().toISOString(),
            }))
          );
        }
      } catch (error) {
        console.error("Error al cargar documentos:", error);
      }
      setSelectedDoc(null);
      setPrintableDoc("")
      setSearchFolio("");
      setCopies(1);
    } catch (error) {
      console.error("Error al cargar documentos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!searchFolio.trim()) {
      toast.error("Ingrese un número de folio para buscar");
      return;
    }

    const foundDoc = docs.find((doc) => doc.folio.includes(searchFolio));
    if (foundDoc) {
      setSelectedDoc(foundDoc);
      setPrintableDoc(`
        <div style="font-family: 'Courier New', monospace; width: 80mm; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; border-bottom: 1px dashed #000; padding-bottom: 15px; margin-bottom: 15px;">
            <div style="font-size: 16px; font-weight: bold;">ANROLTEC SPA</div>
            <div style="font-size: 10px;">RUT: 78.168.951-3</div>
            <div style="font-size: 10px;">Av. Providencia 1234, Santiago</div>
          </div>
          
          <div style="text-align: center; font-weight: bold; margin: 10px 0;">
            ${selectedDoc?.tipo.toUpperCase()}
          </div>
          <div style="font-size: 10px;">Folio: ${selectedDoc?.folio}</div>
          <div style="font-size: 10px;">Total: ${formatPrice(selectedDoc?.total!)}</div>
          <div style="font-size: 10px;">Fecha: ${new Date().toLocaleDateString("es-CL")}</div>
          <div style="text-align: center; margin-top: 20px; border-top: 1px dashed #000; padding-top: 10px;">
            <div style="font-size: 9px;">Documento reimpreso</div>
            <div style="font-size: 9px;">Copias: ${copies}</div>
          </div>
        </div>
      `)
      toast.success("Documento encontrado");
    } else {
      toast.error("No se encontró el documento");
    }
  };

  const handleSelectDoc = (document: Document) => {
    setSelectedDoc(document)
    setPrintableDoc(`
        <div style="font-family: 'Courier New', monospace; width: 80mm; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; border-bottom: 1px dashed #000; padding-bottom: 15px; margin-bottom: 15px;">
            <div style="font-size: 16px; font-weight: bold;">ANROLTEC SPA</div>
            <div style="font-size: 10px;">RUT: 78.168.951-3</div>
            <div style="font-size: 10px;">Av. Providencia 1234, Santiago</div>
          </div>
          
          <div style="text-align: center; font-weight: bold; margin: 10px 0;">
            ${selectedDoc?.tipo.toUpperCase()}
          </div>
          <div style="font-size: 10px;">Folio: ${selectedDoc?.folio}</div>
          <div style="font-size: 10px;">Total: ${formatPrice(selectedDoc?.total!)}</div>
          <div style="font-size: 10px;">Fecha: ${new Date().toLocaleDateString("es-CL")}</div>
          <div style="text-align: center; margin-top: 20px; border-top: 1px dashed #000; padding-top: 10px;">
            <div style="font-size: 9px;">Documento reimpreso</div>
            <div style="font-size: 9px;">Copias: ${copies}</div>
          </div>
        </div>
      `)
  }

  const formatPrice = (n: number) =>
    new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
    }).format(n);

  const handlePrint = () => {
    if (!selectedDoc) {
      toast.error("Debe seleccionar un documento para imprimir");
      return;
    }

    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.width = "0";
    iframe.style.height = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    let content = "";
    for (let i = 0; i < copies; i++) {
      content += printableDoc;
    }
    doc.write(content);
    doc.close();

    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();

    document.body.removeChild(iframe);
    toast.success(`Imprimiendo ${copies} ${copies === 1 ? "copia" : "copias"}`);
  };


  return (
    <div className="h-screen bg-gray-50 flex flex-col no-printme">
      <HeaderWithMenu
        title="Reimprimir"
        icon={<Printer className="w-6 h-6 text-gray-600" />}
        showClock
        userName={user?.nombres || "Desconocido"}
        userAvatarUrl={undefined}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT - 60% */}
        <div className="w-3/5 bg-white p-10 flex items-center justify-center">
          {/* Bloque oculto solo para impresión */}
          {selectedDoc && typeof window !== "undefined" && (
            <div
              id="printablediv"
              style={{ display: "none" }}
              dangerouslySetInnerHTML={{ __html: printableDoc }}
            />
          )}
        </div>

        {/* RIGHT - 40% */}
        <aside className="w-2/5 bg-gray-100 py-10 pl-6 pr-10 overflow-auto space-y-8">
          {/* CARD - Documentos disponibles */}
          {/* Fondo gris liso, sin bordes ni sombras */}
          <div className="rounded-2xl p-8 bg-gray-100">
            <h4 className="text-base font-semibold text-blue-600 mb-6 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-blue-600" />
              Documentos disponibles
            </h4>

            {/* Fecha */}
            <div className="flex items-center mb-4">
              <label className="w-36 text-sm text-gray-700">
                Fecha movimiento
              </label>
              <div className="relative flex-1">
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full h-12 px-4 bg-gray-200 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 w-5 h-5" />
              <input
                type="text"
                placeholder="Ingresa aquí el número de documento"
                value={searchFolio}
                onChange={(e) => setSearchFolio(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-full h-12 pl-12 pr-4 bg-gray-200 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          {/* LISTA o DETALLE */}
          {selectedDoc ? (
            <div className="space-y-6">
              <div
                className={`p-6 rounded-2xl flex justify-between items-center bg-gray-200 
                ${selectedDoc.tipo === "Boleta manual (no válida al SII)"
                    ? "border-b border-gray-200 pb-6"
                    : ""
                  }`}
              >
                <div>
                  <h5 className="font-semibold text-gray-900">
                    {selectedDoc.tipo} N°{selectedDoc.folio}
                  </h5>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatPrice(selectedDoc.total)}
                  </p>
                </div>
                <Printer
                  className="w-6 h-6 text-gray-600 cursor-pointer"
                  onClick={handlePrint}
                />
              </div>

              {/* Copias + Botón */}
              <div className="flex items-center gap-6">
                {/* Fondo gris, sin sombra */}
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-200">
                  <button
                    onClick={() => setCopies((c) => Math.max(1, c - 1))}
                    className="w-6 h-6 flex items-center justify-center hover:bg-gray-300 rounded-full"
                  >
                    −
                  </button>
                  <span className="w-8 text-center font-medium">{copies}</span>
                  <button
                    onClick={() => setCopies((c) => Math.min(10, c + 1))}
                    className="w-6 h-6 flex items-center justify-center hover:bg-gray-300 rounded-full"
                  >
                    +
                  </button>
                  <span className="text-sm text-gray-600 ml-3">Copias</span>
                </div>
                <button
                  onClick={() => {
                    setSelectedDoc(null);
                    setSearchFolio("");
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Volver
                </button>
                <button
                  onClick={handlePrint}
                  className="flex-1 h-12 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 transition"
                >
                  Reimprimir
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {docs.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => handleSelectDoc(doc)}
                  className="p-4 rounded-2xl flex justify-between items-center cursor-pointer bg-gray-50"
                >
                  <div>
                    <span className="text-sm font-medium">
                      {doc.tipo} N°{doc.folio}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatPrice(doc.total)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
