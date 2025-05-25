
import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Dropdown, Select, message, Form, Input, Typography } from 'antd';
import { MoreOutlined, EditOutlined, EyeOutlined, CloseOutlined} from '@ant-design/icons';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title as ChartTitle,
} from 'chart.js';
import { useAuth } from '../../pages/Home/AuthContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTitle,
  Tooltip,
  Legend
);

const { Option } = Select;
const { Title: AntTitle, Text } = Typography;

interface StorageRoom {
  storageRoomId: number;
  storageRoomCode: string | null;
  storageRoomName: string;
  type: string;
  capacity: number;
  remainingRoomVolume: number;
  status: boolean;
  createdBy: number | null;
  createdDate: string;
}

interface SensorData {
  temperature: number;
  humidity: number;
  createdDate: string;
  alertMessage?: string;
  alertDetail?: string;
}

interface StorageRoomTableProps {
  storageRooms: StorageRoom[];
}

const userRoles: { [key: number]: string } = {
  1: 'Giám đốc',
  2: 'Quản lí kho',
  3: 'Trưởng phòng kinh doanh',
  4: 'Nhân viên bán hàng',
};

// Modal for Viewing Storage Room Details
const StorageRoomDetail: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  room: StorageRoom | null;
}> = ({ isOpen, onClose, room }) => {
  const [mounted, setMounted] = useState(false);
  const [fetchedRoom, setFetchedRoom] = useState<StorageRoom | null>(room);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    if (isOpen && room?.storageRoomId) {
      setMounted(true);
      axios
        .get(`${API_BASE_URL}/StorageRoom/GetStorageRoomById/${room.storageRoomId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        })
        .then((response) => {
          if (response.data.success) {
            setFetchedRoom(response.data.data);
          } else {
            message.error(response.data.message || 'Không thể tải thông tin kho!');
          }
        })
        .catch((error) => {
          console.error('Lỗi khi tải thông tin kho:', error);
          message.error('Lỗi khi tải thông tin kho!');
        });
    } else {
      setMounted(false);
    }
  }, [isOpen, room]);

  if (!mounted || !fetchedRoom) return null;

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={[<Button key="close" type="primary" onClick={onClose}>Đóng</Button>]}
      closeIcon={<CloseOutlined />}
      centered
      title="Thông tin kho hàng"
    >
      <div style={{ padding: 16 }}>
        <AntTitle level={5}>Xem thông tin kho hàng ở dưới đây</AntTitle>
        <div style={{ marginBottom: 16 }}>
          <Text strong>Mã kho:</Text>
          <div style={{ padding: 8, background: '#f5f5f5', borderRadius: 4 }}>{fetchedRoom.storageRoomCode || 'N/A'}</div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <Text strong>Tên kho:</Text>
          <div style={{ padding: 8, background: '#f5f5f5', borderRadius: 4 }}>{fetchedRoom.storageRoomName || 'N/A'}</div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <Text strong>Loại phòng:</Text>
          <div style={{ padding: 8, background: '#f5f5f5', borderRadius: 4 }}>{fetchedRoom.type || 'N/A'}</div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <Text strong>Sức chứa (cm³):</Text>
          <div style={{ padding: 8, background: '#f5f5f5', borderRadius: 4 }}>{fetchedRoom.capacity || 'N/A'}</div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <Text strong>Dung tích còn lại:</Text>
          <div style={{ padding: 8, background: '#f5f5f5', borderRadius: 4 }}>{fetchedRoom.remainingRoomVolume || 'N/A'}</div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <Text strong>Trạng thái:</Text>
          <div style={{ padding: 8, background: '#f5f5f5', borderRadius: 4 }}>{fetchedRoom.status ? 'Hoạt động' : 'Không hoạt động'}</div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <Text strong>Tạo bởi:</Text>
          <div style={{ padding: 8, background: '#f5f5f5', borderRadius: 4 }}>{fetchedRoom.createdBy ? userRoles[fetchedRoom.createdBy] : 'N/A'}</div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <Text strong>Thời điểm tạo:</Text>
          <div style={{ padding: 8, background: '#f5f5f5', borderRadius: 4 }}>{fetchedRoom.createdDate || 'N/A'}</div>
        </div>
      </div>
    </Modal>
  );
};

// Modal for Updating Storage Room Details
const UpdateStorageRoomDetail: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  room: StorageRoom;
  onSave: (updatedRoom: StorageRoom) => void;
}> = ({ isOpen, onClose, room, onSave }) => {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [mounted, setMounted] = useState(false);
  const [roomTypes, setRoomTypes] = useState<{ id: string; name: string }[]>([]);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchRoomTypes = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/StorageRoom/RoomTypes`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        });
        const types = Object.entries(response.data).map(([id, name]) => ({
          id: id as string,
          name: name as string,
        }));
        setRoomTypes(types);
      } catch (error) {
        console.error('Error fetching room types:', error);
        setRoomTypes([
          { id: '1', name: 'Phòng thường' },
          { id: '2', name: 'Phòng lạnh' },
          { id: '3', name: 'Phòng mát' },
        ]);
      }
    };

    fetchRoomTypes();

    if (isOpen) {
      setMounted(true);
      form.setFieldsValue({
        storageRoomName: room.storageRoomName,
        type: roomTypes.find((t) => t.name === room.type)?.id || room.type,
        capacity: room.capacity,
        status: room.status ? '1' : '0',
      });
    } else {
      setMounted(false);
    }
  }, [isOpen, room, form, roomTypes]);

  if (!mounted) return null;

  const handleSubmit = async (values: any) => {
    if (!user?.customerId) {
      message.error('Vui lòng đăng nhập để cập nhật kho!');
      return;
    }

    const payload = {
      storageRoomId: room.storageRoomId,
      storageRoomName: values.storageRoomName,
      type: Number(roomTypes.find((t) => t.name === values.type)?.id || values.type),
      capacity: Number(values.capacity),
      status: values.status === '1',
      createdBy: room.createdBy || user.customerId,
      createdDate: room.createdDate,
    };

    try {
      const response = await axios.put(
        `${API_BASE_URL}/StorageRoom/UpdateStorageRoom`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        message.success('Cập nhật thông tin kho hàng thành công!');
        onSave({ ...room, ...response.data.data });
        onClose();
      } else {
        message.error(response.data.message || 'Có lỗi xảy ra!');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        message.error(error.response?.data.message || 'Có lỗi xảy ra khi cập nhật kho!');
      } else {
        message.error('Lỗi không xác định!');
      }
    }
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      closeIcon={<CloseOutlined />}
      centered
      title="Cập nhật thông tin kho hàng"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        style={{ padding: 16 }}
      >
        <Form.Item
          label="Tên kho"
          name="storageRoomName"
          rules={[{ required: true, message: 'Vui lòng nhập tên kho' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Loại phòng"
          name="type"
          rules={[{ required: true, message: 'Vui lòng chọn loại phòng' }]}
        >
          <Select>
            {roomTypes.map((type) => (
              <Option key={type.id} value={type.name}>
                {type.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Sức chứa (cm³)"
          name="capacity"
          rules={[
            { required: true, message: 'Vui lòng nhập sức chứa' },
            {
              validator: async (_, value) => {
                const num = Number(value);
                if (isNaN(num) || num <= 0) {
                  return Promise.reject(new Error('Sức chứa phải lớn hơn 0'));
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <Input type="number" min={0} />
        </Form.Item>

        <Form.Item
          label="Trạng thái"
          name="status"
          rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
        >
          <Select>
            <Option value="1">Hoạt động</Option>
            <Option value="0">Không hoạt động</Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <div style={{ textAlign: 'right' }}>
            <Button onClick={onClose} style={{ marginRight: 8 }}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit">
              Lưu
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

// Modal for Sensor Data Chart
const SensorChartModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  roomId: number;
  roomName: string;
  roomType: string;
}> = ({ isOpen, onClose, roomId, roomName, roomType }) => {
  const [hasSensor, setHasSensor] = useState<boolean | null>(null);
  const [, setHistoryData] = useState<SensorData[]>([]);
  const [displayData, setDisplayData] = useState<SensorData[]>([]);
  const [latestSensorData, setLatestSensorData] = useState<SensorData | null>(null);
  const [alertInfo, setAlertInfo] = useState<{ message: string; detail: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [, setNoDataCount] = useState(0);
  const MAX_DATA_POINTS = 25;
  const MAX_NO_DATA_ATTEMPTS = 10;

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Define thresholds based on room type
  const getThresholds = (type: string) => {
    switch (type) {
      case 'Phòng thường':
        return { tempMin: 15, tempMax: 30, humidityMax: 75 };
      case 'Phòng lạnh':
        return { tempMin: 2, tempMax: 8, humidityMax: 45 };
      case 'Phòng mát':
        return { tempMin: 8, tempMax: 15, humidityMax: 70 };
      default:
        return { tempMin: 15, tempMax: 30, humidityMax: 75 }; // Default to "Phòng thường"
    }
  };

  const thresholds = getThresholds(roomType);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      axios
        .get(`${API_BASE_URL}/StorageHistory/HasSensor/${roomId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        })
        .then((response) => {
          setHasSensor(response.data);
          if (response.data) {
            axios
              .get(`${API_BASE_URL}/StorageHistory/Top50Earliest/${roomId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
              })
              .then((historyResponse) => {
                const data = historyResponse.data.sort(
                  (a: SensorData, b: SensorData) =>
                    new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime()
                );
                setHistoryData(data);
                setDisplayData(data.slice(-MAX_DATA_POINTS));
              })
              .catch((error) => {
                console.error('Lỗi khi lấy dữ liệu lịch sử cảm biến:', error);
                message.error('Lỗi khi lấy dữ liệu lịch sử cảm biến!');
              });
            fetchLatestSensorData();
          }
        })
        .catch((error) => {
          console.error('Lỗi khi kiểm tra cảm biến:', error);
          message.error('Lỗi khi kiểm tra cảm biến!');
          setHasSensor(false);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setHistoryData([]);
      setDisplayData([]);
      setLatestSensorData(null);
      setAlertInfo(null);
      setHasSensor(null);
      setNoDataCount(0);
    }
  }, [isOpen, roomId]);

  const fetchLatestSensorData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/StorageHistory/Newest/${roomId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        timeout: 5000,
      });
      const newData: SensorData & { alertMessage?: string; alertDetail?: string } = response.data;
      console.log('API Response:', JSON.stringify(newData, null, 2));

      setDisplayData((prev) => {
        if (prev.length === 0) {
          console.log('Initial displayData:', [newData]);
          return [newData];
        }
        const lastData = prev[prev.length - 1];
        const isDifferent =
          newData.createdDate !== lastData.createdDate ||
          newData.temperature !== lastData.temperature ||
          newData.humidity !== lastData.humidity;

        if (isDifferent) {
          const updatedData = [...prev, newData].slice(-MAX_DATA_POINTS);
          console.log('Updated displayData:', updatedData);
          setNoDataCount(0);
          return updatedData;
        } else {
          console.log('No update to displayData, data unchanged', {
            newCreatedDate: newData.createdDate,
            prevCreatedDate: lastData.createdDate,
            newTemperature: newData.temperature,
            prevTemperature: lastData.temperature,
            newHumidity: newData.humidity,
            prevHumidity: lastData.humidity,
          });
          setNoDataCount((prev) => {
            const newCount = prev + 1;
            if (newCount >= MAX_NO_DATA_ATTEMPTS) {
              message.warning('Không nhận được dữ liệu cảm biến mới trong thời gian dài!');
            }
            return newCount;
          });
          return prev;
        }
      });
      setLatestSensorData(newData);

      let alertMessage = newData.alertMessage;
      let alertDetail = newData.alertDetail;

      // Check thresholds based on room type
      if (!alertMessage) {
        const { tempMin, tempMax, humidityMax } = thresholds;

        if (newData.temperature > tempMax) {
          alertMessage = 'Nhiệt độ vượt ngưỡng tối đa!';
          alertDetail = `Nhiệt độ hiện tại: ${newData.temperature.toFixed(1)}°C, vượt ngưỡng tối đa ${tempMax}°C`;
        } else if (newData.temperature < tempMin) {
          alertMessage = 'Nhiệt độ thấp hơn ngưỡng tối thiểu!';
          alertDetail = `Nhiệt độ hiện tại: ${newData.temperature.toFixed(1)}°C, dưới ngưỡng tối thiểu ${tempMin}°C`;
        } else if (newData.humidity > humidityMax) {
          alertMessage = 'Độ ẩm vượt ngưỡng tối đa!';
          alertDetail = `Độ ẩm hiện tại: ${newData.humidity.toFixed(1)}%, vượt ngưỡng tối đa ${humidityMax}%`;
        }
      }

      if (alertMessage) {
        setAlertInfo({
          message: alertMessage,
          detail: alertDetail || 'Không có chi tiết bổ sung',
        });
        message.warning({
          content: (
            <div>
              <strong>{alertMessage}</strong>
              <div>{alertDetail || 'Không có chi tiết bổ sung'}</div>
            </div>
          ),
          duration: 5,
        });
      } else {
        console.log('No alert triggered', {
          temperature: newData.temperature,
          humidity: newData.humidity,
          alertMessage: newData.alertMessage,
          alertDetail: newData.alertDetail,
          thresholds,
        });
        setAlertInfo(null);
      }
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu cảm biến mới nhất:', error);
      message.error('Lỗi khi tải dữ liệu cảm biến!');
      setNoDataCount((prev) => {
        const newCount = prev + 1;
        if (newCount >= MAX_NO_DATA_ATTEMPTS) {
          message.warning('Không nhận được dữ liệu cảm biến mới trong thời gian dài!');
        }
        return newCount;
      });
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isOpen && hasSensor) {
      interval = setInterval(() => {
        fetchLatestSensorData();
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, hasSensor]);

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1)
      .toString()
      .padStart(2, '0')}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date
      .getMinutes()
      .toString()
      .padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
  };

  const temperatureChartData = {
    labels: displayData.map((data) => formatDateLabel(data.createdDate)),
    datasets: [
      {
        label: 'Nhiệt độ (°C)',
        data: displayData.map((data) => data.temperature),
        borderColor: 'rgba(255, 99, 132, 0.8)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        pointBackgroundColor: 'rgba(255, 99, 132, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(255, 99, 132, 1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const humidityChartData = {
    labels: displayData.map((data) => formatDateLabel(data.createdDate)),
    datasets: [
      {
        label: 'Độ ẩm (%)',
        data: displayData.map((data) => data.humidity),
        borderColor: 'rgba(54, 162, 235, 0.8)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        pointBackgroundColor: 'rgba(54, 162, 235, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(54, 162, 235, 1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const temperatureChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            size: 14,
            family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
          },
          color: '#333',
        },
      },
      title: {
        display: true,
        text: 'Biểu đồ Nhiệt độ',
        font: {
          size: 18,
          family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
        },
        color: '#333',
        padding: {
          top: 10,
          bottom: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          size: 14,
        },
        bodyFont: {
          size: 12,
        },
        padding: 10,
        callbacks: {
          label: (context: any) => `${context.dataset.label}: ${context.parsed.y.toFixed(1)}°C`,
          title: (tooltipItems: any[]) => formatDateLabel(displayData[tooltipItems[0].dataIndex].createdDate),
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Thời gian',
          font: {
            size: 14,
          },
          color: '#333',
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: 12,
          },
          color: '#555',
        },
        grid: {
          display: false,
        },
      },
      y: {
        title: {
          display: true,
          text: 'Nhiệt độ (°C)',
          font: {
            size: 14,
          },
          color: '#333',
        },
        ticks: {
          font: {
            size: 12,
          },
          color: '#555',
          callback: (tickValue: string | number) => {
            const value = typeof tickValue === 'string' ? parseFloat(tickValue) : tickValue;
            return Number.isFinite(value) ? `${value.toFixed(1)}°C` : '';
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        suggestedMin: 0,
        suggestedMax: 40,
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuad' as const,
    },
  };

  const humidityChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            size: 14,
            family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
          },
          color: '#333',
        },
      },
      title: {
        display: true,
        text: 'Biểu đồ Độ ẩm',
        font: {
          size: 18,
          family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
        },
        color: '#333',
        padding: {
          top: 10,
          bottom: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          size: 14,
        },
        bodyFont: {
          size: 12,
        },
        padding: 10,
        callbacks: {
          label: (context: any) => `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`,
          title: (tooltipItems: any[]) => formatDateLabel(displayData[tooltipItems[0].dataIndex].createdDate),
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Thời gian',
          font: {
            size: 14,
          },
          color: '#333',
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: 12,
          },
          color: '#555',
        },
        grid: {
          display: false,
        },
      },
      y: {
        title: {
          display: true,
          text: 'Độ ẩm (%)',
          font: {
            size: 14,
          },
          color: '#333',
        },
        ticks: {
          font: {
            size: 12,
          },
          color: '#555',
          callback: (tickValue: string | number) => {
            const value = typeof tickValue === 'string' ? parseFloat(tickValue) : tickValue;
            return Number.isFinite(value) ? `${value.toFixed(1)}%` : '';
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        suggestedMin: 0,
        suggestedMax: 100,
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuad' as const,
    },
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={[<Button key="close" type="primary" onClick={onClose}>Đóng</Button>]}
      closeIcon={<CloseOutlined />}
      centered
      title={`Giám sát môi trường kho (Kho ${roomName})`}
      width={900}
    >
      <div style={{ padding: 24 }}>
        {loading ? (
          <Text>Đang tải dữ liệu...</Text>
        ) : hasSensor === false ? (
          <Text>Phòng này không có cảm biến.</Text>
        ) : (
          <>
            {latestSensorData && (
              <div style={{ marginBottom: 16 }}>
                <Text strong>Dữ liệu mới nhất ({formatDateLabel(latestSensorData.createdDate)}):</Text>
                <div style={{ padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
                  Nhiệt độ: {latestSensorData.temperature.toFixed(1)}°C, Độ ẩm: {latestSensorData.humidity.toFixed(1)}%
                </div>
              </div>
            )}
            {alertInfo && (
              <div style={{ marginBottom: 16, padding: 16, background: '#fff1f0', border: '1px solid #ff4d4f', borderRadius: 4 }}>
                <Text strong style={{ color: '#f5222d', display: 'block', marginBottom: 8 }}>Cảnh báo:</Text>
                <Text style={{ color: '#595959', fontSize: 14 }}>{alertInfo.message}</Text>
                {alertInfo.detail && (
                  <Text style={{ color: '#595959', fontSize: 14, display: 'block', marginTop: 4 }}>{alertInfo.detail}</Text>
                )}
              </div>
            )}
            <div style={{ marginBottom: 32, height: 300 }}>
              <AntTitle level={5} style={{ marginBottom: 16 }}>
                Biểu đồ Nhiệt độ
              </AntTitle>
              {displayData.length > 0 ? (
                <Line data={temperatureChartData} options={temperatureChartOptions} />
              ) : (
                <Text>Không có dữ liệu để hiển thị.</Text>
              )}
            </div>
            <div style={{ marginBottom: 32, height: 300 }}>
              <AntTitle level={5} style={{ marginBottom: 16 }}>
                Biểu đồ Độ ẩm
              </AntTitle>
              {displayData.length > 0 ? (
                <Line data={humidityChartData} options={humidityChartOptions} />
              ) : (
                <Text>Không có dữ liệu để hiển thị.</Text>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

// Main StorageRoomTable Component
const StorageRoomTable: React.FC<StorageRoomTableProps> = ({ storageRooms }) => {
  const { user } = useAuth();
  const [selectedRoom, setSelectedRoom] = useState<StorageRoom | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSensorModalOpen, setIsSensorModalOpen] = useState(false);
  const [rooms, setRooms] = useState<StorageRoom[]>(storageRooms);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


  useEffect(() => {
    // Sort rooms by createdDate (newest first)
    const sortedRooms = [...storageRooms].sort((a, b) => {
      return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
    });
  
    setRooms(sortedRooms);
  }, [storageRooms]);
  

  const handleStatusChange = async (value: string, room: StorageRoom) => {
    const newStatus = value === 'Hoạt động';

    Modal.confirm({
      title: 'Bạn có chắc chắn muốn đổi trạng thái?',
      content: 'Hành động này sẽ thay đổi trạng thái của kho.',
      okText: 'Đổi trạng thái',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await axios.put(`${API_BASE_URL}/StorageRoom/ActivateDeactivateStorageRoom/${room.storageRoomId}/${newStatus}`, {}, {
            headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
          });
          message.success('Cập nhật trạng thái thành công!');
          setRooms((prev) =>
            prev.map((r) => (r.storageRoomId === room.storageRoomId ? { ...r, status: newStatus } : r))
          );
        } catch (error) {
          console.error('Lỗi khi cập nhật trạng thái:', error);
          message.error('Lỗi khi cập nhật trạng thái!');
        }
      },
    });
  };

  const handleSave = (updatedRoom: StorageRoom) => {
    setRooms((prev) =>
      prev.map((r) => (r.storageRoomId === updatedRoom.storageRoomId ? updatedRoom : r))
    );
    setIsEditModalOpen(false);
    setSelectedRoom(null);
  };

  const columns = [
    { title: 'Mã Kho', dataIndex: 'storageRoomCode', key: 'storageRoomCode' },
    { title: 'Tên kho - tên phòng', dataIndex: 'storageRoomName', key: 'storageRoomName' },
    { title: 'Loại Phòng', dataIndex: 'type', key: 'type' },
    { title: 'Dung tích(m³)', dataIndex: 'capacity', key: 'capacity' },
    { title: 'Dung tích còn lại(m³)', dataIndex: 'remainingRoomVolume', key: 'remainingRoomVolume' },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: boolean, room: StorageRoom) => {
        const statusText = status ? 'Hoạt động' : 'Không hoạt động';
        if (user?.roleName === 'Director') {
          return (
            <Select
              value={statusText}
              onChange={(value) => handleStatusChange(value, room)}
              style={{ width: 120 }}
            >
              <Option value="Hoạt động">Hoạt động</Option>
              <Option value="Không hoạt động">Không hoạt động</Option>
            </Select>
          );
        }
        return (
          <span
            style={{
              color: status ? '#52c41a' : '#f5222d',
              fontWeight: '500',
            }}
          >
            {statusText}
          </span>
        );
      },
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_: any, room: StorageRoom) => {
        const menuItems = [
          {
            key: 'view',
            icon: <EyeOutlined />,
            label: 'Xem',
            onClick: () => {
              setSelectedRoom(room);
              setIsViewModalOpen(true);
            },
          },
          ...(user?.roleName === 'Director'
            ? [
                {
                  key: 'edit',
                  icon: <EditOutlined />,
                  label: 'Chỉnh sửa',
                  onClick: () => {
                    setSelectedRoom(room);
                    setIsEditModalOpen(true);
                  },
                },
              ]
            : []),
        ];

        return (
          <Dropdown
            menu={{ items: menuItems }}
            trigger={['click']}
          >
            <Button icon={<MoreOutlined />} />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <div>
      <Table
        columns={columns}
        dataSource={rooms}
        rowKey="storageRoomId"
        pagination={{ pageSize: 10 }}
        scroll={{ x: true }}
      />
      {selectedRoom && (
        <>
          <StorageRoomDetail
            isOpen={isViewModalOpen}
            onClose={() => {
              setIsViewModalOpen(false);
              setSelectedRoom(null);
            }}
            room={selectedRoom}
          />
          <UpdateStorageRoomDetail
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedRoom(null);
            }}
            room={selectedRoom}
            onSave={handleSave}
          />
          <SensorChartModal
            isOpen={isSensorModalOpen}
            onClose={() => {
              setIsSensorModalOpen(false);
              setSelectedRoom(null);
            }}
            roomId={selectedRoom.storageRoomId}
            roomName={selectedRoom.storageRoomName}
            roomType={selectedRoom.type}
          />
        </>
      )}
    </div>
  );
};

export default StorageRoomTable;
