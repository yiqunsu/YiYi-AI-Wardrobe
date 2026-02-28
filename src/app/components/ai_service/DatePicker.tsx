"use client";

import { useState, useRef, useEffect } from "react";

interface DatePickerProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

const DatePicker = ({ selectedDate, onDateChange }: DatePickerProps) => {
  const [currentMonth, setCurrentMonth] = useState(
    new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  );
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // 计算可选的最早和最晚日期（今天到未来7天）
  const getToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };

  const getEndDate = () => {
    const endDate = new Date();
    endDate.setHours(0, 0, 0, 0);
    endDate.setDate(endDate.getDate() + 7);
    return endDate;
  };

  const minDate = getToday();
  const maxDate = getEndDate();

  // 格式化日期为 YYYY-MM-DD
  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // 点击外部关闭日历
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsCalendarOpen(false);
      }
    };

    if (isCalendarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCalendarOpen]);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  // 判断当前面板是否还能后退/前进（向前：当前月比minDate月大，向后：当前月小于maxDate月）
  const canGoToPreviousMonth = () => {
    return (
      currentMonth.getFullYear() > minDate.getFullYear() ||
      (currentMonth.getFullYear() === minDate.getFullYear() &&
        currentMonth.getMonth() > minDate.getMonth())
    );
  };

  const canGoToNextMonth = () => {
    return (
      currentMonth.getFullYear() < maxDate.getFullYear() ||
      (currentMonth.getFullYear() === maxDate.getFullYear() &&
        currentMonth.getMonth() < maxDate.getMonth())
    );
  };

  const goToPreviousMonth = () => {
    if (!canGoToPreviousMonth()) return;
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    if (!canGoToNextMonth()) return;
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  // 只允许选择范围内的日期
  const handleDateClick = (day: number) => {
    const newDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    newDate.setHours(0, 0, 0, 0);
    if (newDate < minDate || newDate > maxDate) return;
    onDateChange(newDate);
    setIsCalendarOpen(false);
  };

  const handleTodayClick = () => {
    onDateChange(minDate);
    setCurrentMonth(new Date(minDate.getFullYear(), minDate.getMonth(), 1));
    setIsCalendarOpen(false);
  };

  // 只允许选择今天到7天内
  const isDateDisabled = (day: number): boolean => {
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    date.setHours(0, 0, 0, 0);
    return date < minDate || date > maxDate;
  };

  // 检查日期是否是今天
  const isToday = (day: number): boolean => {
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    return (
      date.getDate() === minDate.getDate() &&
      date.getMonth() === minDate.getMonth() &&
      date.getFullYear() === minDate.getFullYear()
    );
  };

  // 检查是否选中的日期
  const isSelectedDate = (day: number) => {
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === currentMonth.getMonth() &&
      selectedDate.getFullYear() === currentMonth.getFullYear()
    );
  };

  // 显示在按钮上的日期文案（只显示日期）
  const formatDateDisplay = (date: Date): string => {
    return formatDateForInput(date); // 直接用 YYYY-MM-DD 格式
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const weekDays = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div className="relative">
      {/* 触发按钮 */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsCalendarOpen((open) => !open)}
        className="w-full h-12 px-4 pr-10 rounded-lg border border-[#C9B89C] bg-white text-[#171412] text-base focus:ring-[#8B4513] focus:border-[#8B4513] outline-none cursor-pointer flex items-center justify-between relative"
      >
        <span>{formatDateDisplay(selectedDate)}</span>
        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#7B5C49] pointer-events-none z-10">
          calendar_month
        </span>
      </button>
      {/* 日历下拉面板 */}
      {isCalendarOpen && (
        <div
          ref={calendarRef}
          className="absolute top-full left-0 mt-2 p-4 bg-white rounded-lg border border-[#C9B89C] shadow-lg z-50 w-full"
        >
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={goToPreviousMonth}
              disabled={!canGoToPreviousMonth()}
              className={`material-symbols-outlined text-sm cursor-pointer flex items-center justify-center text-[#171412] transition-colors ${
                canGoToPreviousMonth()
                  ? "hover:text-[#8B4513]"
                  : "text-gray-300 cursor-not-allowed"
              }`}
            >
              chevron_left
            </button>
            <span className="text-sm font-bold text-[#171412]">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button
              type="button"
              onClick={goToNextMonth}
              disabled={!canGoToNextMonth()}
              className={`material-symbols-outlined text-sm cursor-pointer flex items-center justify-center text-[#171412] transition-colors ${
                canGoToNextMonth()
                  ? "hover:text-[#8B4513]"
                  : "text-gray-300 cursor-not-allowed"
              }`}
            >
              chevron_right
            </button>
          </div>
          <div className="grid grid-cols-7 text-[10px] text-center font-bold mb-1 text-[#171412]">
            {weekDays.map((day, index) => (
              <span key={index}>{day}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 text-[11px] text-center text-[#171412]">
            {emptyDays.map((_, index) => (
              <div key={`empty-${index}`} className="py-1"></div>
            ))}
            {days.map((day) => {
              const disabled = isDateDisabled(day);
              const today = isToday(day);
              return (
                <div
                  key={day}
                  className={`py-1 rounded-full transition-colors ${
                    disabled
                      ? "text-gray-300 cursor-not-allowed"
                      : isSelectedDate(day)
                      ? "bg-[#8B4513] text-white cursor-pointer hover:bg-[#A0522D]"
                      : today
                      ? "bg-[#EDE0D4] font-bold cursor-pointer hover:bg-[#EDE0D4]/80 hover:text-[#8B4513]"
                      : "cursor-pointer hover:bg-[#EDE0D4] hover:text-[#8B4513]"
                  }`}
                  onClick={() => !disabled && handleDateClick(day)}
                >
                  {day}
                </div>
              );
            })}
          </div>
          {/* Today 按钮 */}
          <div className="mt-3 pt-3 border-t border-[#C9B89C]">
            <button
              type="button"
              onClick={handleTodayClick}
              className="w-full py-2 px-4 bg-[#8B4513] hover:bg-[#A0522D] text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base">today</span>
              Today
            </button>
            <div className="text-[#857266] text-xs mt-2 text-center">Only dates from today to 7 days later can be selected</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;
