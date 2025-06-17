import React, { useState, useRef } from "react";
import axios from "axios";
import { message, Modal } from "antd";

interface AIImageAnalyzerProps {
  handleChangePage: (page: string) => void;
}

const AIImageAnalyzer: React.FC<AIImageAnalyzerProps> = ({
  handleChangePage,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [existsInDatabase, setExistsInDatabase] = useState<boolean | null>(
    null
  );
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [gptSuggestion, setGptSuggestion] = useState<string>("");

  const [productInfo, setProductInfo] = useState<{
    productName: string;
    manufactureName: string;
    weight: string;
    volume: string;
    existsInDatabase: boolean | null;
  }>({
    productName: "",
    manufactureName: "",
    weight: "",
    volume: "",
    existsInDatabase: null,
  });

  const API_AI_URL = import.meta.env.VITE_API_KEY_OPENAI;
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const handleAnalyzeImage = async () => {
    const file = inputRef.current?.files?.[0];
    if (!file) {
      message.error("Hãy chọn ảnh.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setImagePreview(dataUrl);
      const base64Image = dataUrl.split(",")[1];

      setLoading(true);
      setResult("Đang phân tích ảnh...");
      setExistsInDatabase(null);
      setIsModalVisible(false);

      try {
        const productListResponse = await axios.get(
          `${API_BASE_URL}/Product/ListProduct`
        );
        const productList = productListResponse.data?.data || [];

        const productNames = productList
          .map((p: any) => p.productName)
          .filter(Boolean)
          .slice(0, 20);

        const contextPrompt = `Dưới đây là danh sách một số sản phẩm đã có trong hệ thống:\n${productNames
          .map((name: string, idx: number) => `${idx + 1}. ${name}`)
          .join(
            "\n"
          )}\n\nHãy phân tích ảnh dưới đây và trích xuất:\n- Tên sản phẩm\n- Hãng sản xuất\n- Trọng lượng (g)\n- Dung tích (ml).\nHãy so sánh thông tin tên sản phẩm từ ảnh và đối chiếu với dữ liệu đã gửi xem có trùng khớp với sản phẩm nào hay không (nếu trùng khớp thì trả về existsInDatabase: true, không trùng khớp thì trả về existsInDatabase: false)`;

        const aiResponse = await axios.post(
          "https://api.openai.com/v1/chat/completions",
          {
            model: "gpt-4o",
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: contextPrompt },
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:image/jpeg;base64,${base64Image}`,
                    },
                  },
                ],
              },
            ],
            max_tokens: 300,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${API_AI_URL}`,
            },
          }
        );

        const gptContent: string = aiResponse.data.choices[0].message.content;
        setResult(gptContent);

        const extractField = (fieldName: string) => {
          const regex = new RegExp(`${fieldName}[:\\-]?\\s*(.+)`, "i");
          const match = gptContent.match(regex);
          return match ? match[1].trim() : "";
        };

        const productNameRaw = extractField("Tên sản phẩm");
        const manufactureNameRaw = extractField("Hãng sản xuất");
        const weightRaw = extractField("Trọng lượng");
        const volumeRaw = extractField("Dung tích");

        const existsMatch = gptContent.match(
          /existsInDatabase.*?[:\s]*?(true|false)/i
        );
        console.log("gptContent: ", gptContent);
        console.log("existsMatch: ", existsMatch);

        const existsInDatabaseRaw = existsMatch
          ? existsMatch[1].toLowerCase() === "true"
          : null;

        setProductInfo({
          productName: productNameRaw,
          manufactureName: manufactureNameRaw,
          weight: weightRaw,
          volume: volumeRaw,
          existsInDatabase: existsInDatabaseRaw,
        });

        // ✅ Trích xuất dòng gợi ý từ GPT (ví dụ: "Sản phẩm có vẻ trùng khớp...")
        const lines = gptContent.split("\n").map((line) => line.trim());
        const matchLine = lines.find((line) =>
          /trùng khớp|phù hợp|giống với/i.test(line)
        );
        if (matchLine) setGptSuggestion(matchLine);

        setIsModalVisible(true);
      } catch (error: any) {
        setResult(
          `❌ Lỗi: ${
            error?.response?.data?.error?.message ||
            error.message ||
            "Không xác định"
          }`
        );
        setIsModalVisible(true);
      } finally {
        setLoading(false);
      }
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="p-6 mt-[60px] overflow-auto w-full bg-[#fafbfe]">
      <div className="flex justify-between items-center mb-[25px]">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Nhận diện ảnh bao bì thuốc
          </h1>
          <p className="font-semibold text-gray-600">
            Tải ảnh lên để phân tích
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-5 flex flex-col items-center gap-4">
        <input
          type="file"
          accept="image/*"
          ref={inputRef}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = () => {
                const dataUrl = reader.result as string;
                setImagePreview(dataUrl);
              };
              reader.readAsDataURL(file);
            }
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="bg-gray-300 text-black px-8 py-3 rounded-[10px] hover:bg-gray-400 cursor-pointer"
        >
          Thêm ảnh
        </button>

        {imagePreview && (
          <img
            src={imagePreview}
            alt="Ảnh xem trước"
            className="max-w-xs rounded-md"
          />
        )}

        <button
          onClick={handleAnalyzeImage}
          className="bg-blue-600 text-white px-8 py-3 rounded-[10px] border hover:bg-blue-700 cursor-pointer"
          disabled={loading}
        >
          {loading ? "Đang phân tích..." : "Nhận diện"}
        </button>
      </div>

      <Modal
        open={isModalVisible}
        title="Kết quả phân tích"
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
      >
        <table className="w-full text-left border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2">Tên sản phẩm</th>
              <th className="border border-gray-300 px-3 py-2">Nhà sản xuất</th>
              <th className="border border-gray-300 px-3 py-2">
                Trọng lượng (g)
              </th>
              <th className="border border-gray-300 px-3 py-2">
                Dung tích (ml)
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 px-3 py-2">
                {productInfo.productName || "-"}
              </td>
              <td className="border border-gray-300 px-3 py-2">
                {productInfo.manufactureName || "-"}
              </td>
              <td className="border border-gray-300 px-3 py-2">
                {productInfo.weight || "-"}
              </td>
              <td className="border border-gray-300 px-3 py-2">
                {productInfo.volume || "-"}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Thông báo tồn tại sản phẩm */}

        {productInfo.existsInDatabase !== null &&
          (console.log(productInfo.existsInDatabase),
          (
            <p
              className={`mt-3 font-semibold text-center ${
                productInfo.existsInDatabase ? "text-green-600" : "text-red-600"
              }`}
            >
              {productInfo.existsInDatabase
                ? "✅ Sản phẩm CÓ tồn tại trong hệ thống."
                : "❌ Sản phẩm KHÔNG tồn tại trong hệ thống."}
            </p>
          ))}

        {/* Hiển thị dòng gợi ý từ GPT nếu có */}
        {gptSuggestion && (
          <p className="mt-3 text-sm italic text-gray-600 text-center">
            {gptSuggestion}
          </p>
        )}
      </Modal>
    </div>
  );
};

export default AIImageAnalyzer;
