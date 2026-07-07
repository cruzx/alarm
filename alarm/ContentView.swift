//
//  ContentView.swift
//  alarm
//
//  Created by 项程锦 on 2026/7/7.
//

import SwiftUI
import SwiftData
import UserNotifications
import AudioToolbox
import Combine
import AlarmKit
import ActivityKit

// Assuming Item is the SwiftData model. We will treat it as an Alarm with a title and enabled flag using an extension for convenience.
extension Item {
    var title: String {
        // If the model doesn't have a title, synthesize one from the date
        "闹钟：" + timestamp.formatted(date: .numeric, time: .shortened)
    }
}

struct ContentView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \Item.timestamp) private var items: [Item]

    // UI State
    @State private var alarmDate: Date = Calendar.current.date(byAdding: .minute, value: 1, to: Date()) ?? Date()
    @State private var showingFullScreenAlarm: Bool = false
    @State private var firingAlarmDate: Date? = nil
    @State private var notificationAuthorized: Bool = false
    @State private var alarmKitAuthorized: Bool = false
    @State private var schedulingMessage: String? = nil
    @State private var presentedAlarmDates: Set<Date> = []

    private let foregroundAlarmTimer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    var body: some View {
        NavigationStack {
            VStack(spacing: 16) {
                GroupBox("新建闹钟") {
                    VStack(alignment: .leading, spacing: 12) {
                        DatePicker("日期与时间", selection: $alarmDate, displayedComponents: [.date, .hourAndMinute])
                            .datePickerStyle(.graphical)
                        Button(action: scheduleNewAlarm) {
                            Label("添加闹钟", systemImage: "plus.circle.fill")
                                .font(.headline)
                        }
                        .buttonStyle(.borderedProminent)
                        .disabled(!notificationAuthorized && !alarmKitAuthorized)
                        if !notificationAuthorized || !alarmKitAuthorized {
                            Text(permissionMessage)
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                        }
                        if let schedulingMessage {
                            Text(schedulingMessage)
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }

                List {
                    Section("已设置的闹钟") {
                        if items.isEmpty {
                            Text("暂无闹钟")
                                .foregroundStyle(.secondary)
                        } else {
                            ForEach(items) { item in
                                HStack {
                                    VStack(alignment: .leading) {
                                        Text(item.title)
                                            .font(.headline)
                                        Text(item.timestamp.formatted(date: .complete, time: .shortened))
                                            .font(.subheadline)
                                            .foregroundStyle(.secondary)
                                    }
                                    Spacer()
                                    Button(role: .destructive) {
                                        delete(item)
                                    } label: {
                                        Image(systemName: "trash")
                                    }
                                }
                            }
                            .onDelete(perform: deleteItems)
                        }
                    }
                }
            }
            .padding()
            .navigationTitle("闹钟")
            .toolbar { EditButton() }
            .task {
                await requestNotificationAuthorization()
                await requestAlarmKitAuthorization()
                await configureNotificationHandling()
            }
            .onReceive(foregroundAlarmTimer) { now in
                presentDueAlarmIfNeeded(now: now)
            }
            .fullScreenCover(isPresented: $showingFullScreenAlarm) {
                AlarmRingingView(
                    alarmDate: firingAlarmDate ?? Date(),
                    onSnooze: snoozeCurrentAlarm,
                    onStop: dismissAlarmPage
                )
            }
        }
    }

    // MARK: - Alarm Scheduling
    private func scheduleNewAlarm() {
        let fireDate = alarmDate
        guard fireDate > Date() else { return }
        let alarmID = UUID()

        withAnimation {
            let newItem = Item(timestamp: fireDate, alarmIdentifier: alarmID)
            modelContext.insert(newItem)
        }

        scheduleLocalNotification(for: fireDate)
        Task {
            await scheduleSystemAlarm(for: fireDate, id: alarmID)
        }
    }

    private func scheduleLocalNotification(for date: Date) {
        let center = UNUserNotificationCenter.current()
        let content = UNMutableNotificationContent()
        content.title = "闹钟"
        content.body = date.formatted(date: .complete, time: .shortened)
        content.sound = .default
        content.categoryIdentifier = "ALARM_CATEGORY"
        content.interruptionLevel = .timeSensitive
        content.userInfo = ["fireDate": date.timeIntervalSince1970]

        let components = Calendar.current.dateComponents([.year, .month, .day, .hour, .minute, .second], from: date)
        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: false)
        let request = UNNotificationRequest(identifier: UUID().uuidString, content: content, trigger: trigger)
        center.add(request) { error in
            if let error = error {
                print("Failed to schedule notification: \(error)")
            }
        }
    }

    // MARK: - Notification Authorization & Handling
    private func requestNotificationAuthorization() async {
        let center = UNUserNotificationCenter.current()
        do {
            let granted = try await center.requestAuthorization(options: [.alert, .sound, .badge])
            await MainActor.run { self.notificationAuthorized = granted }
        } catch {
            await MainActor.run { self.notificationAuthorized = false }
        }
    }

    private func requestAlarmKitAuthorization() async {
        do {
            let state = try await AlarmManager.shared.requestAuthorization()
            await MainActor.run {
                self.alarmKitAuthorized = state == .authorized
                self.schedulingMessage = state == .authorized ? nil : "系统闹钟权限未开启，后台/锁屏不会像系统闹钟一样响。"
            }
        } catch {
            await MainActor.run {
                self.alarmKitAuthorized = false
                self.schedulingMessage = "系统闹钟权限请求失败：\(error.localizedDescription)"
            }
        }
    }

    @MainActor
    private var permissionMessage: String {
        if !alarmKitAuthorized && !notificationAuthorized {
            return "请允许系统闹钟和通知权限，闹钟到点才会可靠提醒。"
        }
        if !alarmKitAuthorized {
            return "请允许系统闹钟权限，后台/锁屏才会像系统闹钟一样响。"
        }
        return "请允许通知权限，作为系统闹钟之外的提醒兜底。"
    }

    private func scheduleSystemAlarm(for date: Date, id: UUID) async {
        do {
            if AlarmManager.shared.authorizationState != .authorized {
                await requestAlarmKitAuthorization()
            }

            let presentation = AlarmPresentation(
                alert: AlarmPresentation.Alert(title: "闹钟"),
                countdown: AlarmPresentation.Countdown(title: "闹钟即将响起")
            )
            let attributes = AlarmAttributes(
                presentation: presentation,
                metadata: AlarmInfo(title: "闹钟"),
                tintColor: .orange
            )
            let configuration = AlarmManager.AlarmConfiguration(
                countdownDuration: Alarm.CountdownDuration(preAlert: nil, postAlert: 60 * 5),
                schedule: .fixed(date),
                attributes: attributes,
                sound: .default
            )

            _ = try await AlarmManager.shared.schedule(id: id, configuration: configuration)
            await MainActor.run {
                self.schedulingMessage = "已设置：\(date.formatted(date: .omitted, time: .shortened))"
                self.alarmKitAuthorized = true
            }
        } catch {
            await MainActor.run {
                self.schedulingMessage = "系统闹钟设置失败：\(error.localizedDescription)"
            }
        }
    }

    private func configureNotificationHandling() async {
        let center = UNUserNotificationCenter.current()

        // Register category for potential full-screen style
        let alarmCategory = UNNotificationCategory(identifier: "ALARM_CATEGORY", actions: [], intentIdentifiers: [], options: [.customDismissAction])
        center.setNotificationCategories([alarmCategory])

        center.removeAllDeliveredNotifications()

        // Set delegate to intercept notifications while app is in foreground
        await MainActor.run {
            NotificationDelegate.shared.onPresent = { date in
                self.firingAlarmDate = date
                self.showingFullScreenAlarm = true
            }
            center.delegate = NotificationDelegate.shared
        }
    }

    // MARK: - Delete
    private func delete(_ item: Item) {
        cancelSystemAlarm(for: item)
        withAnimation { modelContext.delete(item) }
    }

    private func deleteItems(offsets: IndexSet) {
        withAnimation {
            for index in offsets {
                cancelSystemAlarm(for: items[index])
                modelContext.delete(items[index])
            }
        }
    }

    private func cancelSystemAlarm(for item: Item) {
        guard let alarmIdentifier = item.alarmIdentifier else { return }
        try? AlarmManager.shared.cancel(id: alarmIdentifier)
    }

    private func presentDueAlarmIfNeeded(now: Date) {
        guard !showingFullScreenAlarm else { return }

        let recentDueAlarm = items.first { item in
            let secondsSinceAlarm = now.timeIntervalSince(item.timestamp)
            return secondsSinceAlarm >= 0
                && secondsSinceAlarm <= 60
                && !presentedAlarmDates.contains(item.timestamp)
        }

        guard let recentDueAlarm else { return }
        presentedAlarmDates.insert(recentDueAlarm.timestamp)
        firingAlarmDate = recentDueAlarm.timestamp
        showingFullScreenAlarm = true
    }

    private func snoozeCurrentAlarm() {
        let snoozeDate = Date().addingTimeInterval(9 * 60)

        withAnimation {
            modelContext.insert(Item(timestamp: snoozeDate))
        }

        scheduleLocalNotification(for: snoozeDate)
        dismissAlarmPage()
    }

    private func dismissAlarmPage() {
        showingFullScreenAlarm = false
        firingAlarmDate = nil
    }
}

struct AlarmInfo: AlarmMetadata {
    var title: String
}

// MARK: - Alarm Ringing View
struct AlarmRingingView: View {
    let alarmDate: Date
    var onSnooze: () -> Void
    var onStop: () -> Void

    @State private var now = Date()
    @State private var isAnimating = false

    private let clockTimer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()
    private let alarmSoundTimer = Timer.publish(every: 1.2, on: .main, in: .common).autoconnect()

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [
                    Color(red: 0.04, green: 0.04, blue: 0.05),
                    Color(red: 0.12, green: 0.10, blue: 0.08),
                    Color.black
                ],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            VStack(spacing: 0) {
                Spacer(minLength: 38)

                VStack(spacing: 12) {
                    Text(now.formatted(.dateTime.hour().minute()))
                        .font(.system(size: 76, weight: .thin, design: .rounded))
                        .monospacedDigit()
                        .foregroundStyle(.white)
                        .minimumScaleFactor(0.7)
                        .lineLimit(1)

                    Text(alarmDate.formatted(.dateTime.weekday(.wide).month().day().hour().minute()))
                        .font(.headline)
                        .foregroundStyle(.white.opacity(0.62))
                        .lineLimit(1)
                        .minimumScaleFactor(0.75)
                }

                Spacer(minLength: 42)

                VStack(spacing: 18) {
                    Image(systemName: "alarm.fill")
                        .font(.system(size: 86, weight: .light))
                        .symbolRenderingMode(.hierarchical)
                        .foregroundStyle(.orange)
                        .scaleEffect(isAnimating ? 1.08 : 0.94)
                        .rotationEffect(.degrees(isAnimating ? 4 : -4))
                        .animation(.easeInOut(duration: 0.55).repeatForever(autoreverses: true), value: isAnimating)

                    Text("闹钟")
                        .font(.system(size: 38, weight: .semibold, design: .rounded))
                        .foregroundStyle(.white)

                    Text("到了设定时间")
                        .font(.title3)
                        .foregroundStyle(.white.opacity(0.7))
                }

                Spacer(minLength: 44)

                VStack(spacing: 14) {
                    Button(action: onSnooze) {
                        Label("稍后提醒", systemImage: "zzz")
                            .font(.title3.weight(.semibold))
                            .frame(maxWidth: .infinity, minHeight: 58)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.orange)
                    .controlSize(.large)

                    Button(role: .destructive, action: onStop) {
                        Label("停止", systemImage: "stop.fill")
                            .font(.title3.weight(.semibold))
                            .frame(maxWidth: .infinity, minHeight: 58)
                    }
                    .buttonStyle(.bordered)
                    .tint(.red)
                    .controlSize(.large)
                }
                .padding(.horizontal, 28)
                .padding(.bottom, 36)
            }
            .padding()
        }
        .onAppear { isAnimating = true }
        .onReceive(clockTimer) { now = $0 }
        .onReceive(alarmSoundTimer) { _ in
            AudioServicesPlayAlertSound(SystemSoundID(1005))
            AudioServicesPlaySystemSound(kSystemSoundID_Vibrate)
        }
    }
}

// MARK: - Notification Delegate
final class NotificationDelegate: NSObject, UNUserNotificationCenterDelegate {
    static let shared = NotificationDelegate()
    var onPresent: ((Date) -> Void)?

    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification) async -> UNNotificationPresentationOptions {
        // When in foreground, also show our custom full-screen UI
        let date = notification.request.content.alarmFireDate
        await MainActor.run { self.onPresent?(date) }
        return [.banner, .sound]
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse) async {
        // When user taps notification, bring up full screen as well
        let date = response.notification.request.content.alarmFireDate
        await MainActor.run { self.onPresent?(date) }
    }
}

private extension UNNotificationContent {
    var alarmFireDate: Date {
        if let timestamp = userInfo["fireDate"] as? TimeInterval {
            return Date(timeIntervalSince1970: timestamp)
        }
        return Date()
    }
}

#Preview {
    ContentView()
        .modelContainer(for: Item.self, inMemory: true)
}
