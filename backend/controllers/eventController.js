const Event = require('../models/Event');
const mongoose = require('mongoose');
const { addPoints } = require('../utils/points');
const PointHistory = require('../models/pointHistoryModel');

// Tüm etkinlikleri getir
exports.getEvents = async (req, res) => {
  try {
    // Sorgu parametrelerini al
    const { startDate, endDate } = req.query;
    const query = { userId: req.user.id };

    // Tarih aralığı filtresi
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Etkinlikleri sorgula ve tarihe göre sırala
    const events = await Event.find(query)
      .sort({ date: 1 })
      .lean();

    res.status(200).json(events);
  } catch (error) {
    console.error('Etkinlik getirme hatası:', error);
    res.status(500).json({ message: 'Etkinlikler yüklenirken bir hata oluştu' });
  }
};

// Yeni etkinlik oluştur
exports.createEvent = async (req, res) => {
  try {
    const { title, date, type, description } = req.body;

    // Zorunlu alanları kontrol et
    if (!title || !date) {
      return res.status(400).json({ message: 'Başlık ve tarih alanları zorunludur' });
    }

    // Yeni etkinlik oluştur
    const newEvent = new Event({
      userId: req.user.id,
      title,
      date: new Date(date),
      type: type || 'other',
      description
    });

    // Etkinliği kaydet
    await newEvent.save();

    res.status(201).json(newEvent);
  } catch (error) {
    console.error('Etkinlik oluşturma hatası:', error);
    res.status(500).json({ message: 'Etkinlik oluşturulurken bir hata oluştu' });
  }
};

// Belirli bir etkinliği getir
exports.getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    // ID geçerliliğini kontrol et
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Geçersiz etkinlik ID' });
    }

    // Etkinliği bul
    const event = await Event.findOne({
      _id: id,
      userId: req.user.id
    });

    if (!event) {
      return res.status(404).json({ message: 'Etkinlik bulunamadı' });
    }

    res.status(200).json(event);
  } catch (error) {
    console.error('Etkinlik detayı getirme hatası:', error);
    res.status(500).json({ message: 'Etkinlik detayı yüklenirken bir hata oluştu' });
  }
};

// Etkinliği güncelle
exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date, type, description, completed } = req.body;

    // ID geçerliliğini kontrol et
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Geçersiz etkinlik ID' });
    }

    // Güncellenecek alanları belirle
    const updateData = {};
    if (title) updateData.title = title;
    if (date) updateData.date = new Date(date);
    if (type) updateData.type = type;
    if (description !== undefined) updateData.description = description;
    if (completed !== undefined) updateData.completed = completed;

    // Etkinliği güncelle
    const event = await Event.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      updateData,
      { new: true }
    );

    if (!event) {
      return res.status(404).json({ message: 'Etkinlik bulunamadı' });
    }

    // Eğer etkinlik workout ve completed true'ya döndüyse, o gün için ilk kez ise 20 puan ekle
    if (type === 'workout' && completed === true) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const alreadyRewarded = await PointHistory.findOne({
        user: req.user.id,
        type: 'workout',
        date: { $gte: today }
      });
      if (!alreadyRewarded) {
        await addPoints(req.user.id, 20, 'workout', 'Günlük antrenman tamamlandı');
      }

      // 7 gün üst üste antrenman streak kontrolü
      let streak = 1;
      for (let i = 1; i < 7; i++) {
        const day = new Date(today);
        day.setDate(day.getDate() - i);
        const dayRewarded = await PointHistory.findOne({
          user: req.user.id,
          type: 'workout',
          date: {
            $gte: new Date(day.setHours(0, 0, 0, 0)),
            $lt: new Date(day.setHours(23, 59, 59, 999))
          }
        });
        if (dayRewarded) {
          streak++;
        } else {
          break;
        }
      }
      if (streak === 7) {
        // Son 7 gün üst üste antrenman yapılmışsa 50 puan bonus
        const alreadyStreak = await PointHistory.findOne({
          user: req.user.id,
          type: 'streak',
          date: { $gte: today }
        });
        if (!alreadyStreak) {
          await addPoints(req.user.id, 50, 'streak', '7 gün üst üste antrenman bonusu');
        }
      }
    }

    res.status(200).json(event);
  } catch (error) {
    console.error('Etkinlik güncelleme hatası:', error);
    res.status(500).json({ message: 'Etkinlik güncellenirken bir hata oluştu' });
  }
};

// Etkinliği sil
exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    // ID geçerliliğini kontrol et
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Geçersiz etkinlik ID' });
    }

    // Etkinliği sil
    const event = await Event.findOneAndDelete({
      _id: id,
      userId: req.user.id
    });

    if (!event) {
      return res.status(404).json({ message: 'Etkinlik bulunamadı' });
    }

    res.status(200).json({ message: 'Etkinlik başarıyla silindi' });
  } catch (error) {
    console.error('Etkinlik silme hatası:', error);
    res.status(500).json({ message: 'Etkinlik silinirken bir hata oluştu' });
  }
};