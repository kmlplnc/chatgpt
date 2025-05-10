import { storage } from "../storage";

// Sürekli kontrol edilecek zaman aralığı
const CHECK_INTERVAL = 60 * 1000; // 60 saniye (gerçek uygulamada 5 dakika gibi daha uzun bir süre kullanılabilir)

// Bildirim planı çalıştırıcı
class NotificationScheduler {
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;

  // Servisi başlat
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log("Bildirim planlayıcı servisi başlatıldı");
    
    // İlk kontrolü hemen yap
    this.checkUpcomingAppointments();
    
    // Periyodik kontroller için zamanlayıcı başlat
    this.timer = setInterval(() => {
      this.checkUpcomingAppointments();
    }, CHECK_INTERVAL);
  }

  // Servisi durdur
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    console.log("Bildirim planlayıcı servisi durduruldu");
  }

  // Yaklaşan randevuları kontrol et ve bildirim oluştur
  private async checkUpcomingAppointments() {
    try {
      const now = new Date();
      
      // Tüm randevuları getir
      const appointments = await storage.getAllAppointments();
      
      for (const appointment of appointments) {
        const appointmentDate = new Date(appointment.date);
        
        // Randevu geçmiş mi kontrol et
        if (appointmentDate < now) continue;
        
        // Randevu 1 gün içinde mi kontrol et
        const oneDayBefore = new Date(appointmentDate);
        oneDayBefore.setDate(oneDayBefore.getDate() - 1);
        
        // Randevu 1 saat içinde mi kontrol et
        const oneHourBefore = new Date(appointmentDate);
        oneHourBefore.setHours(oneHourBefore.getHours() - 1);
        
        const timeDiff = appointmentDate.getTime() - now.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        // Eğer randevu 23-25 saat içindeyse ve henüz 1 gün bildirimi gönderilmediyse
        if (hoursDiff >= 23 && hoursDiff <= 25) {
          await this.createReminderIfNeeded(appointment.id, oneDayBefore, "day");
        }
        
        // Eğer randevu 0.5-1.5 saat içindeyse ve henüz 1 saat bildirimi gönderilmediyse
        if (hoursDiff >= 0.5 && hoursDiff <= 1.5) {
          await this.createReminderIfNeeded(appointment.id, oneHourBefore, "hour");
        }
      }
    } catch (error) {
      console.error("Randevu bildirimleri kontrol edilirken hata oluştu:", error);
    }
  }

  // Bildirim gönder (eğer daha önce gönderilmediyse)
  private async createReminderIfNeeded(appointmentId: number, scheduleDate: Date, reminderType: "day" | "hour") {
    try {
      // Daha önce bu randevu için bu tipte bildirim gönderilip gönderilmediğini kontrol et
      const existingNotifications = await storage.getNotificationsByAppointmentId(appointmentId);
      
      const alreadySent = existingNotifications.some(notification => {
        // Bildirimin günlük mü saatlik mi olduğunu kontrol et
        if (reminderType === "day" && notification.content.includes("1 gün sonra")) {
          return true;
        }
        if (reminderType === "hour" && notification.content.includes("1 saat sonra")) {
          return true;
        }
        return false;
      });
      
      if (!alreadySent) {
        // Bildirim oluştur
        await storage.createAppointmentReminder(appointmentId, scheduleDate);
        console.log(`Randevu ${appointmentId} için ${reminderType} türünde hatırlatma bildirimi oluşturuldu`);
      }
    } catch (error) {
      console.error(`Randevu ${appointmentId} için hatırlatma bildirimi oluşturulurken hata:`, error);
    }
  }
}

// Tek bir örnek oluştur
export const notificationScheduler = new NotificationScheduler();