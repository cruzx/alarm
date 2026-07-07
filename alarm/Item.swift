//
//  Item.swift
//  alarm
//
//  Created by 项程锦 on 2026/7/7.
//

import Foundation
import SwiftData

@Model
final class Item {
    var timestamp: Date
    var alarmIdentifier: UUID?
    
    init(timestamp: Date, alarmIdentifier: UUID? = nil) {
        self.timestamp = timestamp
        self.alarmIdentifier = alarmIdentifier
    }
}
